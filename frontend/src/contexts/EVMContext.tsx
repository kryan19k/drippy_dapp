import React, { createContext, useContext, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, appKit } from '../config/appkit'
import { useAccount, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'

interface EVMContextType {
  isConnected: boolean
  address: string | undefined
  balance: string | null
  chainId: number | undefined
  connectWallet: () => void
  disconnectWallet: () => void
  switchChain: (chainId: number) => void
  isReady: boolean
}

const EVMContext = createContext<EVMContextType | undefined>(undefined)

export const useEVM = () => {
  const context = useContext(EVMContext)
  if (context === undefined) {
    throw new Error('useEVM must be used within an EVMProvider')
  }
  return context
}

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface EVMProviderProps {
  children: ReactNode
}

// Inner provider that uses wagmi hooks
const EVMContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // Get balance
  const { data: balanceData } = useBalance({
    address: address,
  })

  // Log current chain for debugging and show warning if wrong network
  React.useEffect(() => {
    if (isConnected && chainId) {
      console.log('🔗 Current EVM Chain ID:', chainId)
      console.log('Expected: 1440000 (Mainnet) or 1449000 (Testnet)')
      
      // Check if on wrong network
      const validChains = [1440000, 1449000]
      if (!validChains.includes(chainId)) {
        console.warn('⚠️ Warning: You are not connected to an XRPL EVM network!')
      }
    }
  }, [chainId, isConnected])

  const connectWallet = () => {
    if (appKit) {
      appKit.open()
    } else {
      console.error('AppKit not initialized. Check VITE_REOWN_PROJECT_ID in .env')
    }
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const handleSwitchChain = (targetChainId: number) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId })
    }
  }

  const value: EVMContextType = {
    isConnected,
    address,
    balance: balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : null,
    chainId,
    connectWallet,
    disconnectWallet,
    switchChain: handleSwitchChain,
    isReady: !!appKit,
  }

  return (
    <EVMContext.Provider value={value}>
      {children}
    </EVMContext.Provider>
  )
}

// Main provider that wraps with Wagmi and QueryClient
export const EVMProvider: React.FC<EVMProviderProps> = ({ children }) => {
  React.useEffect(() => {
    console.log('🔍 EVM Provider Debug:', {
      appKitInitialized: !!appKit,
      projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
      wagmiConfig: !!wagmiAdapter?.wagmiConfig
    })
    
    if (!appKit) {
      console.error('⚠️ Reown AppKit not initialized!')
      console.error('Please check: VITE_REOWN_PROJECT_ID in your .env file')
      console.error('Current value:', import.meta.env.VITE_REOWN_PROJECT_ID)
    }
  }, [])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <EVMContextProvider>
          {children}
        </EVMContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

