#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    vec, Address, Env, IntoVal, String, Symbol,
};

const CLAIM_AMOUNT: i128 = 10_000_000_000;

fn setup_contract(
    env: &Env,
) -> (
    Address,
    Address,
    Address,
    Address,
    Address,
    AuctionContractClient<'_>,
) {
    let admin = Address::generate(env);
    let seller_one = Address::generate(env);
    let seller_two = Address::generate(env);
    let bidder_one = Address::generate(env);
    let bidder_two = Address::generate(env);

    let contract_id = env.register(AuctionContract, ());
    let client = AuctionContractClient::new(env, &contract_id);
    env.mock_all_auths();
    client.initialize(&admin);

    (
        admin, seller_one, seller_two, bidder_one, bidder_two, client,
    )
}

fn create_auction(
    client: &AuctionContractClient<'_>,
    env: &Env,
    seller: &Address,
    title: &str,
    description: &str,
    metadata_uri: &str,
    product_id: &str,
    starting_bid: i128,
    duration_seconds: u64,
    apr_bps: u32,
) -> u64 {
    client.create_auction(
        seller,
        &String::from_str(env, title),
        &String::from_str(env, description),
        &String::from_str(env, metadata_uri),
        &String::from_str(env, product_id),
        &starting_bid,
        &duration_seconds,
        &apr_bps,
    )
}

fn assert_contract_err<T: core::fmt::Debug>(
    result: Result<T, Result<ContractError, soroban_sdk::InvokeError>>,
    expected: ContractError,
) {
    match result {
        Err(Ok(err)) => assert_eq!(err, expected),
        other => panic!("unexpected result: {:?}", other),
    }
}

#[test]
fn token_metadata_and_faucet_work() {
    let env = Env::default();
    let (admin, seller_one, _seller_two, _bidder_one, _bidder_two, client) = setup_contract(&env);

    assert_eq!(client.name(), String::from_str(&env, "Mock USDC"));
    assert_eq!(client.symbol(), String::from_str(&env, "mUSDC"));
    assert_eq!(client.decimals(), 7);
    assert_eq!(client.balance(&seller_one), 0);

    client.claim_test_tokens(&seller_one);
    assert_eq!(client.balance(&seller_one), CLAIM_AMOUNT);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "claim_test_tokens"),
            vec![&env, seller_one.into_val(&env)],
        ),
        ContractError::AlreadyClaimed,
    );

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "initialize"),
            vec![&env, admin.into_val(&env)],
        ),
        ContractError::AlreadyInitialized,
    );
}

#[test]
fn transfer_allowance_and_burn_behaviors_work() {
    let env = Env::default();
    let (_admin, seller_one, _seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&seller_one);
    client.transfer(&seller_one, &bidder_one, &2_000_000_000);

    assert_eq!(client.balance(&seller_one), 8_000_000_000);
    assert_eq!(client.balance(&bidder_one), 2_000_000_000);

    client.approve(&bidder_one, &bidder_two, &500_000_000, &500);
    assert_eq!(client.allowance(&bidder_one, &bidder_two), 500_000_000);

    client.transfer_from(&bidder_two, &bidder_one, &seller_one, &200_000_000);
    assert_eq!(client.balance(&bidder_one), 1_800_000_000);
    assert_eq!(client.balance(&seller_one), 8_200_000_000);
    assert_eq!(client.allowance(&bidder_one, &bidder_two), 300_000_000);

    client.burn(&seller_one, &200_000_000);
    assert_eq!(client.balance(&seller_one), 8_000_000_000);

    client.burn_from(&bidder_two, &bidder_one, &100_000_000);
    assert_eq!(client.balance(&bidder_one), 1_700_000_000);
    assert_eq!(client.allowance(&bidder_one, &bidder_two), 200_000_000);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "transfer_from"),
            vec![
                &env,
                bidder_two.into_val(&env),
                bidder_one.into_val(&env),
                seller_one.into_val(&env),
                300_000_000i128.into_val(&env),
            ],
        ),
        ContractError::InsufficientAllowance,
    );
}

#[test]
fn multiple_auctions_and_dashboards_are_tracked() {
    let env = Env::default();
    let (admin, seller_one, seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&admin);
    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&seller_two);
    client.claim_test_tokens(&bidder_one);
    client.claim_test_tokens(&bidder_two);

    env.ledger().set_timestamp(1_000);
    let auction_one = create_auction(
        &client,
        &env,
        &seller_one,
        "Vintage Camera",
        "Classic film camera",
        "ipfs://camera",
        "product-1",
        100_000_000,
        2_000,
        1_200,
    );
    let auction_two = create_auction(
        &client,
        &env,
        &seller_two,
        "Handmade Vase",
        "Ceramic vase",
        "ipfs://vase",
        "product-2",
        200_000_000,
        3_000,
        1_200,
    );

    client.place_bid(&auction_one, &bidder_one, &100_000_000);
    client.place_bid(&auction_two, &bidder_one, &200_000_000);
    client.place_bid(&auction_two, &bidder_two, &250_000_000);

    assert_eq!(
        client.get_all_auctions(),
        vec![&env, auction_one, auction_two]
    );
    assert_eq!(
        client.get_seller_auctions(&seller_one),
        vec![&env, auction_one]
    );
    assert_eq!(
        client.get_seller_auctions(&seller_two),
        vec![&env, auction_two]
    );
    assert_eq!(
        client.get_bidder_auctions(&bidder_one),
        vec![&env, auction_one, auction_two]
    );
    assert_eq!(
        client.get_bidder_auctions(&bidder_two),
        vec![&env, auction_two]
    );

    client.fund_yield_reserve(&admin, &50_000_000);
    env.ledger().set_timestamp(4_000);
    client.confirm_delivery(&auction_one, &bidder_one);

    assert_eq!(
        client.get_won_auctions(&bidder_one),
        vec![&env, auction_one]
    );
    assert_eq!(
        client.get_auction_status(&auction_one),
        AuctionStatus::Completed
    );
}

#[test]
fn snapshot_and_view_yield_reflect_live_state() {
    let env = Env::default();
    let (admin, seller_one, _seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&admin);
    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&bidder_one);
    client.claim_test_tokens(&bidder_two);

    env.ledger().set_timestamp(1_000);
    let auction_id = create_auction(
        &client,
        &env,
        &seller_one,
        "Vinyl",
        "Rare pressing",
        "ipfs://vinyl",
        "product-live",
        250_000_000,
        2_000,
        1_200,
    );

    let created = client.get_auction(&auction_id);
    assert_eq!(created.auction_id, auction_id);
    assert_eq!(created.seller, seller_one);
    assert_eq!(created.admin, admin);
    assert_eq!(created.highest_bid, 0);
    assert_eq!(client.get_estimated_yield(&auction_id), 0);
    assert_eq!(client.view_yield(&admin), 0);

    client.place_bid(&auction_id, &bidder_one, &250_000_000);
    client.place_bid(&auction_id, &bidder_two, &400_000_000);

    env.ledger().set_timestamp(3_500);
    let ended = client.get_auction(&auction_id);
    assert_eq!(ended.highest_bid, 400_000_000);
    assert_eq!(ended.highest_bidder, Some(bidder_two.clone()));
    assert_eq!(ended.locked_principal, 400_000_000);
    assert_eq!(ended.status, AuctionStatus::AwaitingConfirmation);
    assert_eq!(client.get_estimated_yield(&auction_id), 3_805);
    assert_eq!(client.view_yield(&admin), 3_805);

    assert_contract_err(
        env.try_invoke_contract::<i128, ContractError>(
            &client.address,
            &Symbol::new(&env, "view_yield"),
            vec![&env, bidder_one.into_val(&env)],
        ),
        ContractError::Unauthorized,
    );
}

#[test]
fn bidding_rules_and_refunds_are_enforced() {
    let env = Env::default();
    let (_admin, seller_one, _seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&bidder_one);
    client.claim_test_tokens(&bidder_two);

    env.ledger().set_timestamp(1_000);
    let auction_id = create_auction(
        &client,
        &env,
        &seller_one,
        "Console",
        "Retro console",
        "ipfs://console",
        "product-bid",
        100_000_000,
        2_000,
        1_200,
    );

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "place_bid"),
            vec![
                &env,
                auction_id.into_val(&env),
                seller_one.clone().into_val(&env),
                100_000_000i128.into_val(&env),
            ],
        ),
        ContractError::SellerCannotBidOwnAuction,
    );

    client.place_bid(&auction_id, &bidder_one, &100_000_000);
    assert_eq!(client.balance(&bidder_one), CLAIM_AMOUNT - 100_000_000);
    assert_eq!(client.balance(&client.address), 100_000_000);

    client.place_bid(&auction_id, &bidder_two, &150_000_000);
    assert_eq!(client.balance(&bidder_one), CLAIM_AMOUNT);
    assert_eq!(client.balance(&bidder_two), CLAIM_AMOUNT - 150_000_000);
    assert_eq!(client.balance(&client.address), 150_000_000);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "place_bid"),
            vec![
                &env,
                auction_id.into_val(&env),
                bidder_one.clone().into_val(&env),
                150_000_000i128.into_val(&env),
            ],
        ),
        ContractError::BidTooLow,
    );

    env.ledger().set_timestamp(4_000);
    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "place_bid"),
            vec![
                &env,
                auction_id.into_val(&env),
                bidder_one.into_val(&env),
                200_000_000i128.into_val(&env),
            ],
        ),
        ContractError::AuctionAlreadyEnded,
    );
}

#[test]
fn confirm_delivery_and_cancel_rules_work() {
    let env = Env::default();
    let (admin, seller_one, seller_two, bidder_one, _bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&admin);
    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&seller_two);
    client.claim_test_tokens(&bidder_one);

    let cancellable_id = create_auction(
        &client,
        &env,
        &seller_one,
        "Phone",
        "Used phone",
        "ipfs://phone",
        "product-50",
        100_000_000,
        5_000,
        1_200,
    );
    client.cancel_auction(&cancellable_id);
    assert_eq!(
        client.get_auction_status(&cancellable_id),
        AuctionStatus::Cancelled
    );

    let active_id = create_auction(
        &client,
        &env,
        &seller_two,
        "Tablet",
        "New tablet",
        "ipfs://tablet",
        "product-51",
        100_000_000,
        2_000,
        1_200,
    );

    client.place_bid(&active_id, &bidder_one, &100_000_000);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "cancel_auction"),
            vec![&env, active_id.into_val(&env)],
        ),
        ContractError::CannotCancelWithBids,
    );

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "confirm_delivery"),
            vec![
                &env,
                active_id.into_val(&env),
                bidder_one.clone().into_val(&env),
            ],
        ),
        ContractError::AuctionNotYetEnded,
    );

    client.fund_yield_reserve(&admin, &1_000_000);
    env.ledger().set_timestamp(4_000);
    client.confirm_delivery(&active_id, &bidder_one);

    assert_eq!(
        client.get_auction_status(&active_id),
        AuctionStatus::Completed
    );
    assert_eq!(client.balance(&seller_two), CLAIM_AMOUNT + 100_000_000);
    assert_eq!(client.balance(&admin), CLAIM_AMOUNT - 1_000_000 + 1_522);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "confirm_delivery"),
            vec![&env, active_id.into_val(&env), bidder_one.into_val(&env)],
        ),
        ContractError::AlreadyPaidOut,
    );
}

#[test]
fn dispute_resolution_supports_refund_and_split() {
    let env = Env::default();
    let (admin, seller_one, seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&admin);
    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&seller_two);
    client.claim_test_tokens(&bidder_one);
    client.claim_test_tokens(&bidder_two);

    env.ledger().set_timestamp(1_000);
    let refund_id = create_auction(
        &client,
        &env,
        &seller_one,
        "Camera",
        "Mirrorless camera",
        "ipfs://camera",
        "product-40",
        1_000_000_000,
        2_000,
        31_536_000,
    );

    client.place_bid(&refund_id, &bidder_one, &1_000_000_000);
    client.fund_yield_reserve(&admin, &300_000_000);
    env.ledger().set_timestamp(3_500);
    client.raise_dispute(
        &refund_id,
        &bidder_one,
        &String::from_str(&env, "Wrong item"),
        &String::from_str(&env, "ipfs://evidence"),
    );
    client.resolve_dispute(
        &refund_id,
        &admin,
        &DisputeDecision::RefundBuyer,
        &None,
        &None,
    );

    assert_eq!(
        client.get_auction_status(&refund_id),
        AuctionStatus::Resolved
    );
    assert_eq!(client.balance(&bidder_one), CLAIM_AMOUNT);
    assert_eq!(
        client.balance(&admin),
        CLAIM_AMOUNT - 300_000_000 + 250_000_000
    );

    env.ledger().set_timestamp(4_000);
    let split_id = create_auction(
        &client,
        &env,
        &seller_two,
        "Guitar",
        "Electric guitar",
        "ipfs://guitar",
        "product-41",
        1_000_000_000,
        2_000,
        31_536_000,
    );

    client.place_bid(&split_id, &bidder_two, &1_000_000_000);
    client.fund_yield_reserve(&admin, &300_000_000);
    env.ledger().set_timestamp(6_500);
    client.raise_dispute(
        &split_id,
        &bidder_two,
        &String::from_str(&env, "Damage"),
        &String::from_str(&env, "ipfs://evidence-two"),
    );
    client.resolve_dispute(
        &split_id,
        &admin,
        &DisputeDecision::Split,
        &Some(600_000_000),
        &Some(400_000_000),
    );

    assert_eq!(
        client.get_auction_status(&split_id),
        AuctionStatus::Resolved
    );
    assert_eq!(client.balance(&seller_two), CLAIM_AMOUNT + 600_000_000);
    assert_eq!(client.balance(&bidder_two), CLAIM_AMOUNT - 600_000_000);
    assert_eq!(
        client.balance(&admin),
        CLAIM_AMOUNT - 600_000_000 + 500_000_000
    );
}

#[test]
fn reserve_and_dispute_guards_are_enforced() {
    let env = Env::default();
    let (admin, seller_one, _seller_two, bidder_one, bidder_two, client) = setup_contract(&env);

    client.claim_test_tokens(&admin);
    client.claim_test_tokens(&seller_one);
    client.claim_test_tokens(&bidder_one);
    client.claim_test_tokens(&bidder_two);

    env.ledger().set_timestamp(1_000);
    let auction_id = create_auction(
        &client,
        &env,
        &seller_one,
        "Jacket",
        "Leather jacket",
        "ipfs://jacket",
        "product-dispute",
        300_000_000,
        2_000,
        31_536_000,
    );

    client.place_bid(&auction_id, &bidder_one, &300_000_000);
    env.ledger().set_timestamp(3_500);

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "raise_dispute"),
            vec![
                &env,
                auction_id.into_val(&env),
                bidder_two.into_val(&env),
                String::from_str(&env, "Hijack").into_val(&env),
                String::from_str(&env, "ipfs://bad").into_val(&env),
            ],
        ),
        ContractError::Unauthorized,
    );

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "confirm_delivery"),
            vec![
                &env,
                auction_id.into_val(&env),
                bidder_one.clone().into_val(&env),
            ],
        ),
        ContractError::InsufficientYieldReserve,
    );

    client.raise_dispute(
        &auction_id,
        &bidder_one,
        &String::from_str(&env, "Missing accessory"),
        &String::from_str(&env, "ipfs://missing-accessory"),
    );

    let disputed = client.get_auction(&auction_id);
    assert_eq!(disputed.status, AuctionStatus::Disputed);
    assert_eq!(
        disputed.dispute_reason,
        Some(String::from_str(&env, "Missing accessory"))
    );

    assert_contract_err(
        env.try_invoke_contract::<(), ContractError>(
            &client.address,
            &Symbol::new(&env, "resolve_dispute"),
            vec![
                &env,
                auction_id.into_val(&env),
                admin.clone().into_val(&env),
                DisputeDecision::Split.into_val(&env),
                Some(100_000_000i128).into_val(&env),
                Some(100_000_000i128).into_val(&env),
            ],
        ),
        ContractError::InvalidSplitAmounts,
    );

    client.fund_yield_reserve(&admin, &100_000_000);
    client.resolve_dispute(
        &auction_id,
        &admin,
        &DisputeDecision::ReleaseToSeller,
        &None,
        &None,
    );

    assert_eq!(
        client.get_auction_status(&auction_id),
        AuctionStatus::Resolved
    );
    assert_eq!(client.balance(&seller_one), CLAIM_AMOUNT + 300_000_000);
    assert_eq!(
        client.balance(&admin),
        CLAIM_AMOUNT - 100_000_000 + 75_000_000
    );
}
