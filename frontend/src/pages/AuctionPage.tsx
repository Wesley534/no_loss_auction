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
      setError('This auction link is not valid.')
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
          title="We couldn't load this auction"
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
        description="This listing isn't available right now. It may have been removed or the link may be incorrect."
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
  const principalLabel = isFinalized ? 'Payment released' : 'Protected payment'
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
                success: 'Your bid has been placed and your funds are protected until the auction ends.',
              },
            )
            await refresh()
          }}
        />
      ) : (
        <Card className="space-y-3" tone="primary">
          <h3 className="text-xl font-semibold text-white">Auction status</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {isAwaitingConfirmation
              ? 'Bidding has ended. This order is waiting for the winning buyer to confirm delivery.'
              : isDisputed
                ? 'Bidding has ended. This order is under review and cannot receive new bids.'
                : isFinalized
                  ? `This auction is ${getAuctionStatusText(auction, 'marketplace').toLowerCase()} and bidding is closed.`
                  : 'This auction is not open for bidding right now.'}
          </p>
        </Card>
      )}

      <Card className="space-y-4" tone="secondary">
        <h3 className="text-xl font-semibold text-white">Order actions</h3>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          <p>{principalLabel}: {formatToken(auction.locked_principal)}</p>
          {wallet.isAdmin ? <p>Marketplace reserve estimate: {formatToken(estimatedYield, 6)}</p> : null}
          {isAwaitingConfirmation && confirmationActor ? (
            <p>
              Delivery confirmation is available for the winning buyer only:{' '}
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
                        success: 'Delivery confirmed and payment released to the seller.',
                      },
                    )
                    .then(refresh)
                }
              >
                Confirm Delivery
              </Button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-muted)]">
                Waiting for the winning buyer to confirm delivery.
              </div>
            )
          ) : null}

          {canCancel ? (
            <Button
              isLoading={transaction.isSubmitting}
              onClick={() =>
                void transaction
                  .execute(() => auctionContract.cancelAuction(wallet.address!, id), {
                    pending: 'Canceling your auction...',
                    success: 'Your auction has been canceled.',
                  })
                  .then(refresh)
              }
              variant="ghost"
            >
              Cancel Auction
            </Button>
          ) : null}
        </div>

        {isAwaitingConfirmation && wallet.address && !isWinner ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-muted)]">
            This order is waiting for the winning buyer to confirm delivery before payment can be
            released.
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
                pending: 'Uploading your photo and sending the issue report...',
                success: 'Your issue has been submitted for review.',
              },
            )
            await refresh()
          }}
        />
      ) : null}
    </AuctionDetails>
  )
}
