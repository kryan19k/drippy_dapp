import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { NetworkConfig, NetworkType, NetworkEnvironment, XRPL_MAINNET, EVM_MAINNET, getNetworkByName } from '../types/network'

interface NetworkContextType {
  currentNetwork: NetworkConfig
  networkType: NetworkType
  environment: NetworkEnvironment
  isFirstVisit: boolean
  hasChosenNetwork: boolean
  switchNetwork: (network: NetworkConfig) => void
  switchToXRPL: (environment?: NetworkEnvironment) => void
  switchToEVM: (environment?: NetworkEnvironment) => void
  toggleEnvironment: () => void
  setFirstVisitComplete: () => void
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export const useNetwork = () => {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}

interface NetworkProviderProps {
  children: ReactNode
}

const NETWORK_STORAGE_KEY = 'drippy_selected_network'
const FIRST_VISIT_KEY = 'drippy_has_chosen_network'

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  // Default to EVM Testnet where contracts are deployed
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(() => {
    const evmTestnet = getNetworkByName('xrpl-evm-testnet')
    return evmTestnet || EVM_MAINNET
  })
  const [hasChosenNetwork, setHasChosenNetwork] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  // Load saved network preference on mount
  useEffect(() => {
    try {
      const savedNetworkName = localStorage.getItem(NETWORK_STORAGE_KEY)
      const hasChosen = localStorage.getItem(FIRST_VISIT_KEY) === 'true'
      
      setHasChosenNetwork(hasChosen)
      setIsFirstVisit(!hasChosen)

      if (savedNetworkName) {
        const network = getNetworkByName(savedNetworkName)
        if (network) {
          setCurrentNetwork(network)
        }
      }
    } catch (error) {
      console.error('Failed to load network preference:', error)
    }
  }, [])

  const switchNetwork = (network: NetworkConfig) => {
    setCurrentNetwork(network)
    try {
      localStorage.setItem(NETWORK_STORAGE_KEY, network.name)
      console.log(`Switched to ${network.displayName}`)
    } catch (error) {
      console.error('Failed to save network preference:', error)
    }
  }

  const switchToXRPL = (environment: NetworkEnvironment = 'mainnet') => {
    const network = environment === 'mainnet' ? XRPL_MAINNET : getNetworkByName('xrpl-testnet')!
    switchNetwork(network)
  }

  const switchToEVM = (environment: NetworkEnvironment = 'mainnet') => {
    const network = environment === 'mainnet' ? EVM_MAINNET : getNetworkByName('xrpl-evm-testnet')!
    switchNetwork(network)
  }

  const toggleEnvironment = () => {
    const newEnv = currentNetwork.environment === 'mainnet' ? 'testnet' : 'mainnet'
    const networkName = currentNetwork.type === 'xrpl' 
      ? `xrpl-${newEnv}`
      : `xrpl-evm-${newEnv}`
    
    const network = getNetworkByName(networkName)
    if (network) {
      switchNetwork(network)
    }
  }

  const setFirstVisitComplete = () => {
    setIsFirstVisit(false)
    setHasChosenNetwork(true)
    try {
      localStorage.setItem(FIRST_VISIT_KEY, 'true')
    } catch (error) {
      console.error('Failed to save first visit flag:', error)
    }
  }

  const value: NetworkContextType = {
    currentNetwork,
    networkType: currentNetwork.type,
    environment: currentNetwork.environment,
    isFirstVisit,
    hasChosenNetwork,
    switchNetwork,
    switchToXRPL,
    switchToEVM,
    toggleEnvironment,
    setFirstVisitComplete
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

