import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Toast } from './components/shared/Toast'
import { WalletProvider } from './hooks/useWallet'
import { AuctionPage } from './pages/AuctionPage'
import { BidderDashboard } from './pages/BidderDashboard'
import { CreateAuctionPage } from './pages/CreateAuction'
import { DashboardPage } from './pages/Dashboard'
import { Home } from './pages/Home'
import { SellerDashboard } from './pages/SellerDashboard'

function App() {
  return (
    <WalletProvider>
      <AppLayout>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<CreateAuctionPage />} path="/create" />
          <Route element={<AuctionPage />} path="/auction/:auctionId" />
          <Route element={<SellerDashboard />} path="/auctions" />
          <Route element={<BidderDashboard />} path="/activity" />
          <Route element={<DashboardPage />} path="/dashboard" />
        </Routes>
      </AppLayout>
      <Toast />
    </WalletProvider>
  )
}

export default App
