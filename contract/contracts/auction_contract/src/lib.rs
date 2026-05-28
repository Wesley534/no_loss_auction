#![no_std]

pub mod error;
pub mod events;
pub mod storage;

use crate::error::ContractError;
use crate::events::{
    AuctionCancelledEvent, AuctionCreatedEvent, AuctionFinalizedEvent, BidPlacedEvent,
    DisputeRaisedEvent,
};
use crate::storage::{AuctionState, AuctionStatus, DataKey, DisputeDecision};
use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

#[contract]
pub struct AuctionContract;

const SECONDS_PER_YEAR: u64 = 31_536_000;
const CLAIM_AMOUNT: i128 = 10_000_000_000;

enum SettlementOutcome {
    ReleaseToSeller,
    RefundBuyer,
    Split {
        seller_amount: i128,
        buyer_amount: i128,
    },
}

#[contractimpl]
impl AuctionContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextAuctionId, &0u64);
        env.storage()
            .persistent()
            .set(&DataKey::AllAuctions, &Vec::<u64>::new(&env));

        Ok(())
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, "Mock USDC")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "mUSDC")
    }

    pub fn decimals(_env: Env) -> u32 {
        7
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        Self::read_balance(&env, &id)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        Self::read_allowance(&env, &from, &spender)
    }

    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        from.require_auth();
        Self::move_balance(&env, &from, &to, amount)
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        _live_until_ledger: u32,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        from.require_auth();
        Self::require_positive_amount(amount)?;
        Self::write_allowance(&env, &from, &spender, amount);
        Ok(())
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        spender.require_auth();
        Self::require_positive_amount(amount)?;

        let current_allowance = Self::read_allowance(&env, &from, &spender);
        if current_allowance < amount {
            return Err(ContractError::InsufficientAllowance);
        }

        let updated_allowance = current_allowance
            .checked_sub(amount)
            .ok_or(ContractError::MathOverflow)?;
        Self::move_balance(&env, &from, &to, amount)?;
        Self::write_allowance(&env, &from, &spender, updated_allowance);

        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        from.require_auth();
        Self::debit_balance(&env, &from, amount)
    }

    pub fn burn_from(
        env: Env,
        spender: Address,
        from: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        spender.require_auth();
        Self::require_positive_amount(amount)?;

        let current_allowance = Self::read_allowance(&env, &from, &spender);
        if current_allowance < amount {
            return Err(ContractError::InsufficientAllowance);
        }

        let updated_allowance = current_allowance
            .checked_sub(amount)
            .ok_or(ContractError::MathOverflow)?;
        Self::debit_balance(&env, &from, amount)?;
        Self::write_allowance(&env, &from, &spender, updated_allowance);

        Ok(())
    }

    pub fn claim_test_tokens(env: Env, user: Address) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        user.require_auth();

        if env
            .storage()
            .persistent()
            .has(&DataKey::Claimed(user.clone()))
        {
            return Err(ContractError::AlreadyClaimed);
        }

        Self::credit_balance(&env, &user, CLAIM_AMOUNT)?;
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(user), &true);

        Ok(())
    }

    pub fn fund_yield_reserve(env: Env, admin: Address, amount: i128) -> Result<(), ContractError> {
        Self::require_admin(&env, &admin)?;
        let contract_address = env.current_contract_address();
        Self::move_balance(&env, &admin, &contract_address, amount)
    }

    pub fn create_auction(
        env: Env,
        seller: Address,
        title: String,
        description: String,
        metadata_uri: String,
        product_id: String,
        starting_bid: i128,
        duration_seconds: u64,
        apr_bps: u32,
    ) -> Result<u64, ContractError> {
        let admin = Self::require_initialized(&env)?;
        seller.require_auth();
        Self::require_positive_amount(starting_bid)?;

        if duration_seconds == 0 || apr_bps == 0 {
            return Err(ContractError::InvalidInput);
        }

        Self::require_non_empty(&title)?;
        Self::require_non_empty(&description)?;
        Self::require_non_empty(&metadata_uri)?;
        Self::require_non_empty(&product_id)?;

        let now = env.ledger().timestamp();
        let auction_end_time = now
            .checked_add(duration_seconds)
            .ok_or(ContractError::MathOverflow)?;
        let auction_id = Self::next_auction_id(&env)?;

        let auction = AuctionState {
            auction_id,
            seller: seller.clone(),
            admin,
            title,
            description,
            metadata_uri,
            product_id,
            auction_start_time: now,
            auction_end_time,
            starting_bid,
            highest_bid: 0,
            highest_bidder: None,
            locked_principal: 0,
            accrued_yield: 0,
            apr_bps,
            last_yield_update: now,
            status: AuctionStatus::Active,
            winner: None,
            dispute_reason: None,
            dispute_evidence_uri: None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
        Self::set_next_auction_id(
            &env,
            auction_id
                .checked_add(1)
                .ok_or(ContractError::MathOverflow)?,
        )?;
        Self::append_unique_u64(&env, DataKey::AllAuctions, auction_id)?;
        Self::append_unique_u64(&env, DataKey::SellerAuctions(seller.clone()), auction_id)?;

        AuctionCreatedEvent {
            auction_id,
            seller,
            product_id: auction.product_id.clone(),
            starting_bid,
        }
        .publish(&env);

        Ok(auction_id)
    }

    pub fn place_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        bidder.require_auth();
        Self::require_positive_amount(amount)?;

        let mut auction = Self::load_auction(&env, auction_id)?;
        Self::ensure_bidding_open(&env, &auction)?;

        if bidder == auction.seller {
            return Err(ContractError::SellerCannotBidOwnAuction);
        }

        if amount < auction.starting_bid || amount <= auction.highest_bid {
            return Err(ContractError::BidTooLow);
        }

        Self::accrue_yield(&env, &mut auction)?;

        let contract_address = env.current_contract_address();
        Self::move_balance(&env, &bidder, &contract_address, amount)?;

        if let Some(previous_bidder) = auction.highest_bidder.clone() {
            Self::move_balance(
                &env,
                &contract_address,
                &previous_bidder,
                auction.highest_bid,
            )?;
        }

        auction.highest_bid = amount;
        auction.locked_principal = amount;
        auction.highest_bidder = Some(bidder.clone());
        auction.winner = Some(bidder.clone());
        auction.status = AuctionStatus::Active;

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
        Self::append_unique_u64(&env, DataKey::BidderAuctions(bidder.clone()), auction_id)?;

        BidPlacedEvent {
            auction_id,
            bidder,
            amount,
        }
        .publish(&env);

        Ok(())
    }

    pub fn cancel_auction(env: Env, auction_id: u64) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        let mut auction = Self::load_auction(&env, auction_id)?;
        auction.seller.require_auth();

        if env.ledger().timestamp() >= auction.auction_end_time {
            return Err(ContractError::AuctionAlreadyEnded);
        }

        if auction.highest_bid > 0 || auction.highest_bidder.is_some() {
            return Err(ContractError::CannotCancelWithBids);
        }

        auction.status = AuctionStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        AuctionCancelledEvent {
            auction_id,
            seller: auction.seller,
        }
        .publish(&env);

        Ok(())
    }

    pub fn confirm_delivery(
        env: Env,
        auction_id: u64,
        winner: Address,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        winner.require_auth();

        let mut auction = Self::load_auction(&env, auction_id)?;
        Self::ensure_can_finalize(&env, &auction, &winner, true)?;

        Self::accrue_yield(&env, &mut auction)?;
        Self::release_settlement(&env, &auction, SettlementOutcome::ReleaseToSeller)?;

        auction.status = AuctionStatus::Completed;
        auction.last_yield_update = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        if let Some(winner_address) = auction.winner.clone() {
            Self::append_unique_u64(&env, DataKey::WonAuctions(winner_address), auction_id)?;
        }

        AuctionFinalizedEvent {
            auction_id,
            actor: winner,
            status: AuctionStatus::Completed,
        }
        .publish(&env);

        Ok(())
    }

    pub fn raise_dispute(
        env: Env,
        auction_id: u64,
        winner: Address,
        reason: String,
        evidence_uri: String,
    ) -> Result<(), ContractError> {
        Self::require_initialized(&env)?;
        winner.require_auth();
        Self::require_non_empty(&reason)?;
        Self::require_non_empty(&evidence_uri)?;

        let mut auction = Self::load_auction(&env, auction_id)?;
        Self::ensure_can_finalize(&env, &auction, &winner, false)?;

        Self::accrue_yield(&env, &mut auction)?;
        auction.status = AuctionStatus::Disputed;
        auction.last_yield_update = env.ledger().timestamp();
        auction.dispute_reason = Some(reason.clone());
        auction.dispute_evidence_uri = Some(evidence_uri.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        DisputeRaisedEvent {
            auction_id,
            bidder: winner,
            reason,
            evidence_uri,
        }
        .publish(&env);

        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        auction_id: u64,
        admin: Address,
        decision: DisputeDecision,
        seller_amount: Option<i128>,
        buyer_amount: Option<i128>,
    ) -> Result<(), ContractError> {
        Self::require_admin(&env, &admin)?;
        let mut auction = Self::load_auction(&env, auction_id)?;

        if auction.is_finalized() {
            return Err(ContractError::AlreadyPaidOut);
        }

        if auction.status != AuctionStatus::Disputed {
            return Err(ContractError::AuctionNotDisputed);
        }

        if auction.highest_bidder.is_none() {
            return Err(ContractError::NoBids);
        }

        Self::accrue_yield(&env, &mut auction)?;
        let settlement = match decision {
            DisputeDecision::ReleaseToSeller => SettlementOutcome::ReleaseToSeller,
            DisputeDecision::RefundBuyer => SettlementOutcome::RefundBuyer,
            DisputeDecision::Split => {
                let seller_amount = seller_amount.ok_or(ContractError::InvalidSplitAmounts)?;
                let buyer_amount = buyer_amount.ok_or(ContractError::InvalidSplitAmounts)?;

                if seller_amount < 0 || buyer_amount < 0 {
                    return Err(ContractError::InvalidSplitAmounts);
                }

                if seller_amount
                    .checked_add(buyer_amount)
                    .ok_or(ContractError::MathOverflow)?
                    != auction.highest_bid
                {
                    return Err(ContractError::InvalidSplitAmounts);
                }

                SettlementOutcome::Split {
                    seller_amount,
                    buyer_amount,
                }
            }
        };

        Self::release_settlement(&env, &auction, settlement)?;
        auction.status = AuctionStatus::Resolved;
        auction.last_yield_update = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        if let Some(winner_address) = auction.winner.clone() {
            Self::append_unique_u64(&env, DataKey::WonAuctions(winner_address), auction_id)?;
        }

        AuctionFinalizedEvent {
            auction_id,
            actor: admin,
            status: AuctionStatus::Resolved,
        }
        .publish(&env);

        Ok(())
    }

    pub fn get_auction(env: Env, auction_id: u64) -> Result<AuctionState, ContractError> {
        Self::require_initialized(&env)?;
        Self::snapshot_auction(&env, auction_id)
    }

    pub fn get_auction_status(env: Env, auction_id: u64) -> Result<AuctionStatus, ContractError> {
        Ok(Self::get_auction(env, auction_id)?.status)
    }

    pub fn get_all_auctions(env: Env) -> Result<Vec<u64>, ContractError> {
        Self::require_initialized(&env)?;
        Ok(Self::load_u64_list(&env, &DataKey::AllAuctions))
    }

    pub fn get_seller_auctions(env: Env, seller: Address) -> Result<Vec<u64>, ContractError> {
        Self::require_initialized(&env)?;
        Ok(Self::load_u64_list(&env, &DataKey::SellerAuctions(seller)))
    }

    pub fn get_bidder_auctions(env: Env, bidder: Address) -> Result<Vec<u64>, ContractError> {
        Self::require_initialized(&env)?;
        Ok(Self::load_u64_list(&env, &DataKey::BidderAuctions(bidder)))
    }

    pub fn get_won_auctions(env: Env, bidder: Address) -> Result<Vec<u64>, ContractError> {
        Self::require_initialized(&env)?;
        Ok(Self::load_u64_list(&env, &DataKey::WonAuctions(bidder)))
    }

    pub fn get_estimated_yield(env: Env, auction_id: u64) -> Result<i128, ContractError> {
        Ok(Self::get_auction(env, auction_id)?.accrued_yield)
    }

    pub fn view_yield(env: Env, admin: Address) -> Result<i128, ContractError> {
        Self::require_admin(&env, &admin)?;

        let auction_ids = Self::load_u64_list(&env, &DataKey::AllAuctions);
        let mut total_yield = 0i128;
        let mut index = 0u32;

        while index < auction_ids.len() {
            let auction_id = auction_ids.get(index).unwrap_or_default();
            let auction = Self::snapshot_auction(&env, auction_id)?;
            total_yield = total_yield
                .checked_add(auction.accrued_yield)
                .ok_or(ContractError::MathOverflow)?;
            index += 1;
        }

        Ok(total_yield)
    }
}

impl AuctionContract {
    fn require_initialized(env: &Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)
    }

    fn require_admin(env: &Env, admin: &Address) -> Result<(), ContractError> {
        let stored_admin: Address = Self::require_initialized(env)?;
        if stored_admin != *admin {
            return Err(ContractError::Unauthorized);
        }

        admin.require_auth();
        Ok(())
    }

    fn require_non_empty(value: &String) -> Result<(), ContractError> {
        if value.len() == 0 {
            return Err(ContractError::InvalidInput);
        }

        Ok(())
    }

    fn require_positive_amount(amount: i128) -> Result<(), ContractError> {
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        Ok(())
    }

    fn next_auction_id(env: &Env) -> Result<u64, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::NextAuctionId)
            .ok_or(ContractError::NotInitialized)
    }

    fn set_next_auction_id(env: &Env, next_auction_id: u64) -> Result<(), ContractError> {
        env.storage()
            .instance()
            .set(&DataKey::NextAuctionId, &next_auction_id);
        Ok(())
    }

    fn load_auction(env: &Env, auction_id: u64) -> Result<AuctionState, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .ok_or(ContractError::AuctionNotFound)
    }

    fn snapshot_auction(env: &Env, auction_id: u64) -> Result<AuctionState, ContractError> {
        let mut auction = Self::load_auction(env, auction_id)?;
        if auction.is_finalized() {
            return Ok(auction);
        }

        let now = env.ledger().timestamp();
        auction.accrued_yield = Self::pending_yield(&auction, now)?;

        if auction.status == AuctionStatus::Active
            && now >= auction.auction_end_time
            && auction.highest_bidder.is_some()
        {
            auction.status = AuctionStatus::AwaitingConfirmation;
        }

        Ok(auction)
    }

    fn ensure_bidding_open(env: &Env, auction: &AuctionState) -> Result<(), ContractError> {
        if auction.is_finalized() {
            return Err(ContractError::AlreadyPaidOut);
        }

        if auction.status != AuctionStatus::Active {
            return Err(ContractError::AuctionNotActive);
        }

        if env.ledger().timestamp() >= auction.auction_end_time {
            return Err(ContractError::AuctionAlreadyEnded);
        }

        Ok(())
    }

    fn ensure_can_finalize(
        env: &Env,
        auction: &AuctionState,
        winner: &Address,
        confirmation_only: bool,
    ) -> Result<(), ContractError> {
        if auction.is_finalized() {
            return Err(ContractError::AlreadyPaidOut);
        }

        if confirmation_only && auction.status == AuctionStatus::Disputed {
            return Err(ContractError::AuctionNotDisputed);
        }

        if !matches!(
            auction.status,
            AuctionStatus::Active | AuctionStatus::AwaitingConfirmation
        ) {
            return Err(ContractError::AuctionNotActive);
        }

        if env.ledger().timestamp() < auction.auction_end_time {
            return Err(ContractError::AuctionNotYetEnded);
        }

        let highest_bidder = auction
            .highest_bidder
            .clone()
            .ok_or(ContractError::NoBids)?;
        if highest_bidder != *winner {
            return Err(ContractError::Unauthorized);
        }

        Ok(())
    }

    fn accrue_yield(env: &Env, auction: &mut AuctionState) -> Result<(), ContractError> {
        if auction.is_finalized() {
            return Ok(());
        }

        let now = env.ledger().timestamp();
        auction.accrued_yield = Self::pending_yield(auction, now)?;
        auction.last_yield_update = now;
        Ok(())
    }

    fn pending_yield(auction: &AuctionState, now: u64) -> Result<i128, ContractError> {
        if now < auction.last_yield_update {
            return Err(ContractError::InvalidLedgerTime);
        }

        if auction.is_finalized() || auction.locked_principal <= 0 {
            return Ok(auction.accrued_yield);
        }

        let elapsed = now
            .checked_sub(auction.last_yield_update)
            .ok_or(ContractError::InvalidLedgerTime)?;
        if elapsed == 0 || auction.apr_bps == 0 {
            return Ok(auction.accrued_yield);
        }

        let pending = auction
            .locked_principal
            .checked_mul(i128::from(auction.apr_bps))
            .and_then(|value| value.checked_mul(i128::from(elapsed)))
            .and_then(|value| value.checked_div(10_000))
            .and_then(|value| value.checked_div(i128::from(SECONDS_PER_YEAR)))
            .ok_or(ContractError::MathOverflow)?;

        auction
            .accrued_yield
            .checked_add(pending)
            .ok_or(ContractError::MathOverflow)
    }

    fn release_settlement(
        env: &Env,
        auction: &AuctionState,
        outcome: SettlementOutcome,
    ) -> Result<(), ContractError> {
        let contract_address = env.current_contract_address();
        let contract_balance = Self::read_balance(env, &contract_address);
        let required_total = auction
            .highest_bid
            .checked_add(auction.accrued_yield)
            .ok_or(ContractError::MathOverflow)?;

        if contract_balance < auction.highest_bid {
            return Err(ContractError::InsufficientEscrowBalance);
        }
        if contract_balance < required_total {
            return Err(ContractError::InsufficientYieldReserve);
        }

        let highest_bidder = auction
            .highest_bidder
            .clone()
            .ok_or(ContractError::NoBids)?;

        match outcome {
            SettlementOutcome::ReleaseToSeller => {
                if auction.highest_bid > 0 {
                    Self::move_balance(
                        env,
                        &contract_address,
                        &auction.seller,
                        auction.highest_bid,
                    )?;
                }
            }
            SettlementOutcome::RefundBuyer => {
                if auction.highest_bid > 0 {
                    Self::move_balance(
                        env,
                        &contract_address,
                        &highest_bidder,
                        auction.highest_bid,
                    )?;
                }
            }
            SettlementOutcome::Split {
                seller_amount,
                buyer_amount,
            } => {
                if seller_amount > 0 {
                    Self::move_balance(env, &contract_address, &auction.seller, seller_amount)?;
                }
                if buyer_amount > 0 {
                    Self::move_balance(env, &contract_address, &highest_bidder, buyer_amount)?;
                }
            }
        }

        if auction.accrued_yield > 0 {
            Self::move_balance(
                env,
                &contract_address,
                &auction.admin,
                auction.accrued_yield,
            )?;
        }

        Ok(())
    }

    fn read_balance(env: &Env, address: &Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(address.clone()))
            .unwrap_or(0)
    }

    fn write_balance(env: &Env, address: &Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::Balance(address.clone()), &amount);
    }

    fn read_allowance(env: &Env, from: &Address, spender: &Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(from.clone(), spender.clone()))
            .unwrap_or(0)
    }

    fn write_allowance(env: &Env, from: &Address, spender: &Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &amount);
    }

    fn credit_balance(env: &Env, address: &Address, amount: i128) -> Result<(), ContractError> {
        Self::require_positive_amount(amount)?;

        let updated_balance = Self::read_balance(env, address)
            .checked_add(amount)
            .ok_or(ContractError::MathOverflow)?;
        Self::write_balance(env, address, updated_balance);
        Ok(())
    }

    fn debit_balance(env: &Env, address: &Address, amount: i128) -> Result<(), ContractError> {
        Self::require_positive_amount(amount)?;

        let current_balance = Self::read_balance(env, address);
        if current_balance < amount {
            return Err(ContractError::InsufficientBalance);
        }

        let updated_balance = current_balance
            .checked_sub(amount)
            .ok_or(ContractError::MathOverflow)?;
        Self::write_balance(env, address, updated_balance);
        Ok(())
    }

    fn move_balance(
        env: &Env,
        from: &Address,
        to: &Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        Self::debit_balance(env, from, amount)?;
        Self::credit_balance(env, to, amount)?;
        Ok(())
    }

    fn load_u64_list(env: &Env, key: &DataKey) -> Vec<u64> {
        env.storage().persistent().get(key).unwrap_or(Vec::new(env))
    }

    fn save_u64_list(env: &Env, key: &DataKey, list: &Vec<u64>) {
        env.storage().persistent().set(key, list);
    }

    fn contains_u64(list: &Vec<u64>, value: u64) -> bool {
        let mut index = 0u32;
        while index < list.len() {
            if list.get(index).unwrap_or_default() == value {
                return true;
            }
            index += 1;
        }

        false
    }

    fn append_unique_u64(env: &Env, key: DataKey, value: u64) -> Result<(), ContractError> {
        let mut list = Self::load_u64_list(env, &key);
        if !Self::contains_u64(&list, value) {
            list.push_back(value);
            Self::save_u64_list(env, &key, &list);
        }

        Ok(())
    }
}

mod test;
