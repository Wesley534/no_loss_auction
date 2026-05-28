use soroban_sdk::{contractevent, Address, String};

use crate::storage::AuctionStatus;

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionCreatedEvent {
    #[topic]
    pub auction_id: u64,
    #[topic]
    pub seller: Address,
    pub product_id: String,
    pub starting_bid: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BidPlacedEvent {
    #[topic]
    pub auction_id: u64,
    #[topic]
    pub bidder: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionFinalizedEvent {
    #[topic]
    pub auction_id: u64,
    #[topic]
    pub actor: Address,
    pub status: AuctionStatus,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionCancelledEvent {
    #[topic]
    pub auction_id: u64,
    #[topic]
    pub seller: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeRaisedEvent {
    #[topic]
    pub auction_id: u64,
    #[topic]
    pub bidder: Address,
    pub reason: String,
    pub evidence_uri: String,
}
