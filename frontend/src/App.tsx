import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import AMM from './pages/AMM'
import BuyDrippy from './pages/BuyDrippy'
import Swap from './pages/Swap'
import Liquidity from './pages/Liquidity'
import Staking from './pages/Staking'
import Bridge from './pages/Bridge'
import NFTPage from './pages/NFTPage'
import NFTDetail from './pages/NFTDetail'
import Analytics from './pages/Analytics'
import Governance from './pages/Governance'
import Admin from './pages/Admin'
import { XRPLProvider } from './contexts/XRPLContext'
import { EVMProvider } from './contexts/EVMContext'
import { NetworkProvider } from './contexts/NetworkContext'
import { ThemeProvider } from './contexts/ThemeContext'
import XamanConnectModal from './components/XamanConnectModal'
import NetworkSelectionModal from './components/NetworkSelectionModal'
import { useXRPL } from './contexts/XRPLContext'
import { useNetwork } from './contexts/NetworkContext'
import { useNetworkCheck } from './hooks/useNetworkCheck'

// Component that uses hooks for auto-switching
function AppContent() {
  useNetworkCheck() // Auto-check and switch to correct network on connect
  
  return (
    <div className="min-h-screen">
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/amm" element={<AMM />} />
          <Route path="/buy" element={<BuyDrippy />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/liquidity" element={<Liquidity />} />
          <Route path="/staking" element={<Staking />} />
          <Route path="/bridge" element={<Bridge />} />
          <Route path="/nft" element={<NFTPage />} />
          <Route path="/nft/:tokenId" element={<NFTDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
        }}
      />
      <XRPLConnectModalGateway />
      <NetworkSelectionGateway />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <EVMProvider>
          <XRPLProvider>
            <Router>
              <AppContent />
            </Router>
          </XRPLProvider>
        </EVMProvider>
      </NetworkProvider>
    </ThemeProvider>
  )
}

export default App

// Renders the Xaman modal at app root so it's available from context
function XRPLConnectModalGateway() {
  const { isConnectModalOpen, closeConnectModal, handleXummAuthorized } = useXRPL() as any
  return (
    <XamanConnectModal
      isOpen={isConnectModalOpen}
      onClose={closeConnectModal}
      onAuthorized={handleXummAuthorized}
    />
  )
}

// Renders the network selection modal for first-time visitors
function NetworkSelectionGateway() {
  const { isFirstVisit } = useNetwork()
  return <NetworkSelectionModal isOpen={isFirstVisit} />
}
