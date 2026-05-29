import { LayoutDashboard, PlusCircle, Shield, ShoppingBag, Trophy } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Card } from '../shared/Card'
import { NAV_ITEMS } from '../../lib/constants'

const ICONS = [ShoppingBag, PlusCircle, LayoutDashboard, Trophy, Shield]

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const location = useLocation()

  return (
    <>
      {open ? (
        <button
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-76 border-r border-white/5 bg-[rgba(9,16,31,0.96)] px-5 py-6 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mt-20 flex h-full flex-col">
          <div className="mb-8 px-2">
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--primary)]">
              Marketplace Menu
            </div>
            <h2 className="text-2xl font-semibold text-white">Harbor Auctions</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Browse listings, manage sales, follow bids, and handle buyer issues in one place.
            </p>
          </div>

          <div className="space-y-2">
            {NAV_ITEMS.map((item, index) => {
              const Icon = ICONS[index]
              const active = location.pathname === item.href
              return (
                <Link
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? 'bg-[var(--primary)]/14 font-semibold text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:bg-white/6 hover:text-white'
                  }`}
                  key={item.href}
                  onClick={onClose}
                  to={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-auto">
            <Card tone="secondary" className="rounded-[26px] p-5">
              <div className="mb-2 text-sm font-semibold text-white">Ready to sell something?</div>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Create a listing, add a photo, and start accepting bids in minutes.
              </p>
              <Link
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                to="/create"
              >
                Create Auction
              </Link>
            </Card>
          </div>
        </div>
      </aside>
    </>
  )
}
