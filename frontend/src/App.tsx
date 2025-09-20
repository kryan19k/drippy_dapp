import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import NFTPage from './pages/NFTPage'
import Analytics from './pages/Analytics'
import Governance from './pages/Governance'
import Admin from './pages/Admin'
import { XRPLProvider } from './contexts/XRPLContext'
import { ThemeProvider } from './contexts/ThemeContext'
import XamanConnectModal from './components/XamanConnectModal'
// import XamanSignModal from './components/XamanSignModal'
import { useXRPL } from './contexts/XRPLContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <XRPLProvider>
          <Router>
            <div className="min-h-screen">
              <Layout>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/nft" element={<NFTPage />} />
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
            </div>
          </Router>
        </XRPLProvider>
      </ThemeProvider>
    </QueryClientProvider>
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

// Optional: Gateway for sign modal if you later wire modal state into context
// Currently sign function operates without a separate modal gateway.
