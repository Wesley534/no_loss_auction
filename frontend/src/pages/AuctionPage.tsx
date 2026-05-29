import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AuctionDetails } from '../components/auction/AuctionDetails'
import { BidForm } from '../components/auction/BidForm'
import { DisputeForm } from '../components/auction/DisputeForm'
import { Button } from '../components/shared/Button'
import { Card } from '../components/shared/Card'
import { EmptyState } from '../components/shared/EmptyState'
import { Loader } from '../components/shared/Loader'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { auctionContract, type AuctionState } from '../lib/contract'
import { getErrorMessage } from '../lib/errors'
import { formatAddress, formatToken } from '../lib/format'
import { uploadAuctionImage } from '../lib/pinata'
import { getAuctionStatusText } from '../lib/status'

export function AuctionPage() {
  const { auctionId } = useParams()
  const wallet = useWallet()
  const transaction = useTransaction()
  const [auction, setAuction] = useState<AuctionState | null>(null)
  const [estimatedYield, setEstimatedYield] = useState<bigint>(0n)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = auctionId ? BigInt(auctionId) : undefined

  const refresh = async () => {
    if (id === undefined) {
      setAuction(null)
      setError('Invalid auction id.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextAuction = await auctionContract.getAuction(id)
      setAuction(nextAuction)

      if (wallet.isAdmin) {
        try {
          const nextYield = await auctionContract.getEstimatedYield(id)
          setEstimatedYield(nextYield)
        } catch {
          // Yield is informative only. Keep the auction page usable if this read fails.
          setEstimatedYield(nextAuction.accrued_yield ?? 0n)
        }
      } else {
        setEstimatedYield(0n)
      }
    } catch (err) {
      setAuction(null)
      setEstimatedYield(0n)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [id, wallet.isAdmin])

  if (isLoading) {
    return <Loader label="Loading auction details..." />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <EmptyState
          description={error}
          title="Auction details could not be loaded"
        />
        <div className="flex justify-center">
          <Button onClick={() => void refresh()} variant="ghost">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (id === undefined || !auction) {
    return (
      <EmptyState
        description="The requested auction could not be found on this network."
        title="Auction unavailable"
      />
    )
  }

  const isSeller = wallet.address === auction.seller
  const confirmationActor = auction.winner ?? auction.highest_bidder ?? null
  const isWinner = wallet.address === confirmationActor
  const noBids = auction.highest_bid === 0n
  const status = auction.status.tag
  const isActive = status === 'Active'
  const isAwaitingConfirmation = status === 'AwaitingConfirmation'
  const isDisputed = status === 'Disputed'
  const isFinalized = ['Completed', 'Resolved', 'Cancelled'].includes(status)
  const principalLabel = isFinalized ? 'Principal distributed' : 'Locked principal'
  const canBid = isActive
  const canCancel = isActive && isSeller && noBids
  const canConfirm = isWinner && isAwaitingConfirmation
  const canRaiseDispute = isWinner && (isAwaitingConfirmation || isDisputed)

  return (
    <AuctionDetails
      auction={auction}
      estimatedYield={estimatedYield}
      showYield={wallet.isAdmin}
    >
      {canBid ? (
        <BidForm
          isLoading={transaction.isSubmitting}
          onSubmit={async (amount) => {
            if (!wallet.address) return
            await transaction.execute(
              () => auctionContract.placeBid(wallet.address!, id, wallet.address!, amount),
              {
                pending: 'Submitting your bid...',
                success: 'Bid accepted and escrow updated.',
              },
            )
            await refresh()
          }}
        />
      ) : (
        <Card className="space-y-3">
          <h3 className="text-xl font-semibold text-white">Auction status</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {isAwaitingConfirmation
              ? 'Bidding has ended. This auction is awaiting delivery confirmation from the winning bidder.'
              : isDisputed
                ? 'Bidding has ended. This auction is under dispute review and cannot receive new bids.'
                : isFinalized
                  ? `This auction is ${getAuctionStatusText(auction, 'marketplace').toLowerCase()} and no further bids can be placed.`
                  : 'This auction is not open for bidding right now.'}
          </p>
        </Card>
      )}

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Settlement actions</h3>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          <p>{principalLabel}: {formatToken(auction.locked_principal)}</p>
          {wallet.isAdmin ? <p>Simulated yield: {formatToken(estimatedYield, 6)}</p> : null}
          {isAwaitingConfirmation && confirmationActor ? (
            <p>
              On-chain confirmation is authorized for the winning bidder only:{' '}
              <span className="font-semibold text-white">
                {formatAddress(confirmationActor)}
              </span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {isAwaitingConfirmation ? (
            canConfirm ? (
              <Button
                isLoading={transaction.isSubmitting}
                onClick={() =>
                  void transaction
                    .execute(
                      () => auctionContract.confirmDelivery(wallet.address!, id, wallet.address!),
                      {
                        pending: 'Confirming delivery...',
                        success: 'Auction settled and payout released.',
                      },
                    )
                    .then(refresh)
                }
              >
                Confirm delivery as winner
              </Button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-muted)]">
                Awaiting delivery confirmation from the winning bidder.
              </div>
            )
          ) : null}

          {canCancel ? (
            <Button
              isLoading={transaction.isSubmitting}
              onClick={() =>
                void transaction
                  .execute(() => auctionContract.cancelAuction(wallet.address!, id), {
                    pending: 'Cancelling auction...',
                    success: 'Auction cancelled.',
                  })
                  .then(refresh)
              }
              variant="ghost"
            >
              Cancel auction
            </Button>
          ) : null}
        </div>

        {isAwaitingConfirmation && wallet.address && !isWinner ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-muted)]">
            This auction is waiting for the winning bidder to confirm delivery. Sellers and admins
            cannot call `confirm_delivery` in the current contract.
          </div>
        ) : null}
      </Card>

      {canRaiseDispute ? (
        <DisputeForm
          isLoading={transaction.isSubmitting}
          onSubmit={async (reason, evidenceImage) => {
            if (!wallet.address) return
            await transaction.execute(
              async () => {
                const upload = await uploadAuctionImage(evidenceImage)
                return auctionContract.raiseDispute(
                  wallet.address!,
                  id,
                  wallet.address!,
                  reason,
                  upload.ipfsUrl,
                )
              },
              {
                pending: 'Uploading evidence and submitting dispute...',
                success: 'Dispute raised for admin review.',
              },
            )
            await refresh()
          }}
        />
      ) : null}
    </AuctionDetails>
  )
}
