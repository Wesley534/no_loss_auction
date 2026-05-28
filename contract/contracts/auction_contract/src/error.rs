use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AuctionNotFound = 3,
    AuctionNotActive = 4,
    AuctionNotDisputed = 5,
    AuctionAlreadyEnded = 6,
    Unauthorized = 7,
    InvalidAmount = 8,
    InsufficientBalance = 9,
    InsufficientAllowance = 10,
    AlreadyClaimed = 11,
    BidTooLow = 12,
    SellerCannotBidOwnAuction = 13,
    CannotCancelWithBids = 14,
    NoBids = 15,
    InvalidSplitAmounts = 16,
    InsufficientEscrowBalance = 17,
    InsufficientYieldReserve = 18,
    AlreadyPaidOut = 19,
    MathOverflow = 20,
    InvalidLedgerTime = 21,
    AuctionNotYetEnded = 22,
    InvalidInput = 23,
}
