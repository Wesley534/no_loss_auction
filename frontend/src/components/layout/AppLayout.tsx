import { Gavel, LayoutDashboard, ShoppingBag } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { NAV_ITEMS } from '../../lib/constants'
import { Navbar } from './Navbar'

const MOBILE_ICONS = [ShoppingBag, LayoutDashboard, Gavel, LayoutDashboard]

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto min-h-screen max-w-[1280px] px-4 pt-24 pb-32 md:px-6 lg:px-12">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-[rgba(66,71,84,0.1)] bg-[rgba(45,52,73,0.9)] px-4 py-2 shadow-lg backdrop-blur-lg lg:hidden">
        {NAV_ITEMS.map((item, index) => {
          const Icon = MOBILE_ICONS[index]
          const active = location.pathname === item.href
          return (
            <Link
              className={
                active
                  ? 'flex flex-col items-center justify-center rounded-full bg-[var(--primary)] px-4 py-1 text-[var(--on-primary)]'
                  : 'flex flex-col items-center justify-center p-2 text-[var(--text-muted)]'
              }
              key={item.href}
              to={item.href}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
