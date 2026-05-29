import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { Card } from '../components/shared/Card'
import { EmptyState } from '../components/shared/EmptyState'
import { Input } from '../components/shared/Input'
import { Loader } from '../components/shared/Loader'
import { AuctionImage } from '../components/shared/AuctionImage'
import { useAuctions } from '../hooks/useAuctions'
import { useToken } from '../hooks/useToken'
import { useWallet } from '../hooks/useWallet'
import { auctionContract } from '../lib/contract'
import { formatAddress, formatToken } from '../lib/format'
import { getAuctionStatusText } from '../lib/status'

const FILTERS = ['All Bids', 'My Bids'] as const
const PAGE_SIZE = 10

export function BidderDashboard() {
  const wallet = useWallet()
  const token = useToken()
  const { auctions, isLoading } = useAuctions()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All Bids')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [bidAuctionIds, setBidAuctionIds] = useState<bigint[]>([])
  const [wonAuctionIds, setWonAuctionIds] = useState<bigint[]>([])

  useEffect(() => {
    async function loadBidActivity() {
      if (!wallet.address) {
        setBidAuctionIds([])
        setWonAuctionIds([])
        return
      }

      const [bids, wins] = await Promise.all([
        auctionContract.getBidderAuctions(wallet.address),
        auctionContract.getWonAuctions(wallet.address),
      ])
      setBidAuctionIds(bids)
      setWonAuctionIds(wins)
    }

    void loadBidActivity()
  }, [wallet.address])

  const allBidAuctions = useMemo(
    () => auctions.filter((auction) => auction.highest_bid > 0n),
    [auctions],
  )
  const myBidAuctions = useMemo(
    () =>
      auctions.filter(
        (auction) =>
          bidAuctionIds.includes(auction.auction_id) || wonAuctionIds.includes(auction.auction_id),
      ),
    [auctions, bidAuctionIds, wonAuctionIds],
  )
  const scopedAuctions = filter === 'All Bids' ? allBidAuctions : myBidAuctions
  const visibleAuctions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return scopedAuctions

    return scopedAuctions.filter((auction) => {
      const haystack = [
        auction.title,
        auction.product_id,
        auction.seller,
        auction.highest_bidder ?? '',
        auction.winner ?? '',
        getAuctionStatusText(auction, 'bidder', wallet.address),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [scopedAuctions, searchTerm, wallet.address])

  const activeBids = myBidAuctions.filter((auction) =>
    ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel),
  )
  const wonAuctions = useMemo(
    () => auctions.filter((auction) => wonAuctionIds.includes(auction.auction_id)),
    [auctions, wonAuctionIds],
  )
  const refundedAuctions = myBidAuctions.filter(
    (auction) =>
      auction.highest_bidder !== wallet.address && !wonAuctionIds.includes(auction.auction_id),
  )
  const bidsInEscrow = activeBids.reduce((sum, auction) => sum + auction.highest_bid, 0n)
  const refundsReceived = refundedAuctions.reduce((sum, auction) => sum + auction.highest_bid, 0n)
  const totalPages = Math.max(1, Math.ceil(visibleAuctions.length / PAGE_SIZE))
  const paginatedAuctions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return visibleAuctions.slice(start, start + PAGE_SIZE)
  }, [currentPage, visibleAuctions])

  const emptyState =
    filter === 'All Bids'
      ? {
          title: 'No bidding activity yet',
          description: 'Once buyers start placing bids, they will appear here.',
        }
      : {
          title: wallet.address ? 'No bids for this wallet yet' : 'Connect your wallet to see your bids',
          description: wallet.address
            ? 'Place a bid or win an auction and your activity will appear here.'
            : 'Connect your wallet to filter the marketplace feed down to your own bids.',
        }

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
              Buying Activity
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-white">Bids and purchases</h1>
          <p className="text-[var(--text-muted)]">
            Follow the auctions you're bidding on, the ones you've won, and any refunds or next
            steps that matter to you.
          </p>
        </div>
        <Card tone="primary" className="flex items-center gap-4 rounded-xl p-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Available Balance
            </span>
            <span className="mono text-xl text-[var(--primary)]">{formatToken(token.balance)}</span>
          </div>
          <div className="h-10 w-px bg-[rgba(66,71,84,0.3)]" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Wallet
            </span>
            <span className="mono text-sm text-[var(--secondary)]">
              {formatAddress(wallet.address)}
            </span>
          </div>
        </Card>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card tone="primary" className="rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Protected Bids</span>
          </div>
          <div className="mono text-2xl text-white">{formatToken(bidsInEscrow)}</div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            {activeBids.length} Open For You
          </div>
        </Card>
        <Card tone="secondary" className="rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Refunds Received</span>
          </div>
          <div className="mono text-2xl text-white">{formatToken(refundsReceived)}</div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Returned automatically when you are outbid
          </div>
        </Card>
        <Card tone="tertiary" className="rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Auctions Won</span>
          </div>
          <div className="mono text-2xl text-white">{wonAuctions.length}</div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Total spent: {formatToken(wonAuctions.reduce((sum, auction) => sum + auction.highest_bid, 0n))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">Auction activity</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {filter === 'All Bids'
                ? 'Showing every auction that has received at least one bid.'
                : 'Showing auctions you have bid on or won.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-container-low)] p-1">
            {FILTERS.map((item) => {
              const disabled = item === 'My Bids' && !wallet.address
              return (
                <button
                  className={
                    filter === item
                      ? 'rounded-md bg-[var(--surface-container-highest)] px-4 py-1.5 text-xs font-bold text-white'
                      : 'rounded-md px-4 py-1.5 text-xs font-bold text-[var(--text-muted)] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                  }
                  disabled={disabled}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            className="w-full"
            label="Search auctions"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title, item reference, seller, bidder, or status"
            value={searchInput}
          />
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm(searchInput)
                setCurrentPage(1)
              }}
              type="button"
            >
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Loader label="Loading auction activity..." />
        ) : visibleAuctions.length === 0 ? (
          <EmptyState description={emptyState.description} title={emptyState.title} />
        ) : (
          <Card tone="primary" className="overflow-hidden rounded-2xl p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-fixed text-left">
                <thead className="border-b border-[rgba(66,71,84,0.1)] bg-[rgba(19,27,46,0.5)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <tr>
                    <th className="w-[23%] px-6 py-4">Auction</th>
                    <th className="w-[13%] px-6 py-4">Seller</th>
                    <th className="w-[14%] px-6 py-4">Current Leader</th>
                    <th className="w-[12%] px-6 py-4">Current Bid</th>
                    <th className="w-[14%] px-6 py-4">Status</th>
                    <th className="w-[16%] px-6 py-4">Tags</th>
                    <th className="w-[8%] px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(66,71,84,0.1)]">
                  {paginatedAuctions.map((auction) => {
                    const isWalletWinner =
                      Boolean(wallet.address) &&
                      (auction.winner ?? auction.highest_bidder) === wallet.address &&
                      auction.statusLabel === 'AwaitingConfirmation'
                    const isWalletLeader = wallet.address === auction.highest_bidder
                    const isMine =
                      Boolean(wallet.address) &&
                      (bidAuctionIds.includes(auction.auction_id) ||
                        wonAuctionIds.includes(auction.auction_id))

                    return (
                      <tr
                        className="transition-colors hover:bg-[rgba(34,42,61,0.3)]"
                        key={auction.auction_id.toString()}
                      >
                        <td className="px-6 py-5 align-top">
                          <div className="line-clamp-2 font-semibold text-white">{auction.title}</div>
                          <div className="mono mt-1 text-xs text-[var(--text-faint)]">
                            {auction.product_id}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-white">
                          {formatAddress(auction.seller)}
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-white">
                          {formatAddress(auction.highest_bidder ?? undefined)}
                        </td>
                        <td className="px-6 py-5 align-top mono text-white">
                          {formatToken(auction.highest_bid)}
                        </td>
                        <td className="px-6 py-5 align-top text-sm leading-6 text-[var(--secondary)]">
                          {getAuctionStatusText(auction, 'bidder', wallet.address)}
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex max-w-full flex-wrap gap-2">
                            {isWalletWinner ? (
                              <span className="inline-flex max-w-full items-center rounded-full border border-[rgba(255,185,95,0.2)] bg-[rgba(255,185,95,0.1)] px-3 py-1 text-[11px] font-semibold leading-5 text-[var(--tertiary)]">
                                You Won
                              </span>
                            ) : null}
                            {isWalletLeader ? (
                              <span className="inline-flex max-w-full items-center rounded-full border border-[rgba(78,222,163,0.2)] bg-[rgba(78,222,163,0.1)] px-3 py-1 text-[11px] font-semibold leading-5 text-[var(--secondary)]">
                                Leading Bid
                              </span>
                            ) : null}
                            {isMine ? (
                              <span className="inline-flex max-w-full items-center rounded-full border border-[rgba(173,198,255,0.2)] bg-[rgba(173,198,255,0.1)] px-3 py-1 text-[11px] font-semibold leading-5 text-[var(--primary)]">
                                My Bids
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-right">
                          <Link
                            className="inline-flex min-w-[112px] items-center justify-center rounded-xl border border-[var(--primary)] px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-[var(--primary)] transition-colors hover:bg-[rgba(173,198,255,0.05)]"
                            to={`/auction/${auction.auction_id.toString()}`}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-start justify-between gap-3 border-t border-[rgba(66,71,84,0.1)] p-4 sm:flex-row sm:items-center">
              <div className="text-sm text-[var(--text-muted)]">
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, visibleAuctions.length)}-
                {Math.min(currentPage * PAGE_SIZE, visibleAuctions.length)} of {visibleAuctions.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  type="button"
                  variant="ghost"
                >
                  Previous
                </Button>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  type="button"
                  variant="ghost"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-white">Auctions you won</h2>
          <span className="rounded bg-[rgba(255,185,95,0.1)] px-2 py-0.5 text-xs text-[var(--tertiary)]">
            Buyer actions
          </span>
        </div>
        <div className="space-y-4">
          {wonAuctions.map((auction) => (
            <Card
              className="flex flex-col items-center gap-6 rounded-xl p-6 lg:flex-row"
              tone="secondary"
              key={auction.auction_id.toString()}
            >
              <div className="w-full lg:w-1/4">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--surface-container-highest)]">
                  <AuctionImage
                    alt={auction.title}
                    className="h-full w-full object-cover"
                    src={auction.metadata_uri}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(8,13,28,0.5)] via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 text-[10px] font-bold uppercase text-white">
                    {auction.statusLabel === 'Resolved' || auction.statusLabel === 'Completed'
                      ? 'Completed'
                      : 'Awaiting confirmation'}
                  </div>
                </div>
              </div>
              <div className="flex-grow">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">{auction.title}</h3>
                  <span className="mono text-sm text-[var(--primary)]">
                    ID: {auction.auction_id.toString()}
                  </span>
                </div>
                <p className="mb-4 max-w-2xl text-[var(--text-muted)]">
                  Your payment of {formatToken(auction.highest_bid)} is protected until you confirm
                  the item arrived as expected, or report an issue if something went wrong.
                </p>
                <div className="flex flex-wrap gap-4 text-xs uppercase text-[var(--text-muted)]">
                  <span>Seller: {formatAddress(auction.seller)}</span>
                  <span>Status: {getAuctionStatusText(auction, 'bidder', wallet.address)}</span>
                </div>
              </div>
              {auction.statusLabel === 'AwaitingConfirmation' ? (
                <div className="flex w-full min-w-[200px] flex-col gap-3 lg:w-auto">
                  <Link
                    className="w-full rounded-lg bg-[var(--secondary)] py-3 text-center text-sm font-bold text-[var(--on-secondary)] shadow-lg shadow-[rgba(78,222,163,0.2)] transition-all active:scale-95"
                    to={`/auction/${auction.auction_id.toString()}`}
                  >
                    Confirm Delivery
                  </Link>
                  <Link
                    className="w-full rounded-lg border border-[var(--danger)] py-3 text-center text-sm font-bold text-[var(--danger)] transition-all hover:bg-[rgba(255,138,128,0.05)] active:scale-95"
                    to={`/auction/${auction.auction_id.toString()}`}
                  >
                    Report an Issue
                  </Link>
                </div>
              ) : (
                <div className="flex w-full min-w-[200px] flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--text-muted)] lg:w-auto">
                  <div>
                    This order is already complete, so buyer confirmation and issue reporting are
                    no longer available.
                  </div>
                  <Link
                    className="inline-flex justify-center rounded-lg bg-[var(--secondary)] py-3 text-center text-sm font-bold text-[var(--on-secondary)] transition-all active:scale-95"
                    to={`/auction/${auction.auction_id.toString()}`}
                  >
                    View Details
                  </Link>
                </div>
              )}
            </Card>
          ))}
          {!isLoading && wonAuctions.length === 0 ? (
            <EmptyState
              description="When you win an auction, delivery confirmation and issue reporting will appear here."
              title="No won auctions yet"
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
