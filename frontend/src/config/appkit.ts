// Reown AppKit configuration for EVM Sidechain
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from '@reown/appkit/networks'

// Define XRPL EVM Sidechain networks
// Note: Chain ID verified via RPC endpoint query
export const xrplEvmMainnet = defineChain({
  id: 1440000, // CORRECT: Verified via eth_chainId RPC call (0x15f900)
  caipNetworkId: 'eip155:1440000',
  chainNamespace: 'eip155',
  name: 'XRPL EVM Sidechain',
  nativeCurrency: {
    decimals: 18,
    name: 'XRP',
    symbol: 'XRP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.xrplevm.org'],
    },
  },
  blockExplorers: {
    default: { name: 'XRPL EVM Explorer', url: 'https://explorer.xrplevm.org' },
  },
  contracts: {
    // Deployed contracts on mainnet (when available)
  },
})

export const xrplEvmTestnet = defineChain({
  id: 1449000, // XRPL EVM Sidechain Testnet - Deployed contracts here!
  caipNetworkId: 'eip155:1449000',
  chainNamespace: 'eip155',
  name: 'XRPL EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XRP',
    symbol: 'XRP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.xrplevm.org'],
      webSocket: ['wss://ws.testnet.xrplevm.org'],
    },
  },
  blockExplorers: {
    default: { name: 'XRPL EVM Testnet Explorer', url: 'https://evm-sidechain.xrpl.org' },
  },
  contracts: {
    // Deployed DRIPPY contracts on Testnet (Chain 1449000)
    drippyToken: {
      address: '0xAb09F142b1550253bAd5F8D4E28592Da0716c62A',
      blockCreated: 0,
    },
    feeRouter: {
      address: '0x688a19A37B913B21096E610e232BdC20adeBa1FD',
      blockCreated: 0,
    },
  },
})

// Project metadata
export const metadata = {
  name: 'Drippy',
  description: 'Next-Gen DeFi Rewards on XRPL',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://drippy.app',
  icons: ['/drippylogo.png']
}

// Get project ID from environment
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

if (!projectId) {
  console.error('❌ VITE_REOWN_PROJECT_ID not found in environment variables!')
  console.error('Please add VITE_REOWN_PROJECT_ID=your-project-id to your .env file')
  console.error('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
}

// Configure networks
export const networks = [xrplEvmMainnet, xrplEvmTestnet] as const

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [xrplEvmMainnet, xrplEvmTestnet],
  projectId: projectId || '',
  ssr: false // Set to true if using server-side rendering
})

// Create AppKit instance
export const appKit = projectId ? createAppKit({
  adapters: [wagmiAdapter],
  networks: [xrplEvmMainnet, xrplEvmTestnet],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: true, // Enable email login
    socials: ['google', 'x', 'github', 'discord'], // Social login options
    emailShowWallets: true, // Show wallet options alongside email/social
  },
  allWallets: 'SHOW',
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6', // Primary blue
    '--w3m-border-radius-master': '8px',
  }
}) : null

export { projectId }

