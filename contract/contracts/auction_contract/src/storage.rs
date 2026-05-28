use soroban_sdk::{contracttype, Address, String};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum AuctionStatus {
    Active,
    AwaitingConfirmation,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DisputeDecision {
    ReleaseToSeller,
    RefundBuyer,
    Split,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct AuctionState {
    pub auction_id: u64,
    pub seller: Address,
    pub admin: Address,
    pub title: String,
    pub description: String,
    pub metadata_uri: String,
    pub product_id: String,
    pub auction_start_time: u64,
    pub auction_end_time: u64,
    pub starting_bid: i128,
    pub highest_bid: i128,
    pub highest_bidder: Option<Address>,
    pub locked_principal: i128,
    pub accrued_yield: i128,
    pub apr_bps: u32,
    pub last_yield_update: u64,
    pub status: AuctionStatus,
    pub winner: Option<Address>,
    pub dispute_reason: Option<String>,
    pub dispute_evidence_uri: Option<String>,
}

impl AuctionState {
    pub fn is_finalized(&self) -> bool {
        matches!(
            self.status,
            AuctionStatus::Completed | AuctionStatus::Resolved | AuctionStatus::Cancelled
        )
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    Admin,
    NextAuctionId,
    AllAuctions,
    Auction(u64),
    SellerAuctions(Address),
    BidderAuctions(Address),
    WonAuctions(Address),
    Balance(Address),
    Allowance(Address, Address),
    Claimed(Address),
}
