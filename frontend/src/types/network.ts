// Network types for DRIPPY dual-chain architecture

export type NetworkType = 'xrpl' | 'evm'
export type NetworkEnvironment = 'mainnet' | 'testnet'

export interface NetworkConfig {
  type: NetworkType
  environment: NetworkEnvironment
  name: string
  displayName: string
  chainId?: number | string
  rpcUrl: string
  explorerUrl: string
  currency: string
  icon: string
  description: string
  features: NetworkFeature[]
}

export type NetworkFeature = 
  | 'amm'
  | 'wallet'
  | 'send'
  | 'receive'
  | 'buy-drippy'
  | 'swap'
  | 'liquidity'
  | 'nft'
  | 'staking'
  | 'governance'
  | 'analytics'

export const XRPL_MAINNET: NetworkConfig = {
  type: 'xrpl',
  environment: 'mainnet',
  name: 'xrpl-mainnet',
  displayName: 'XRPL Mainnet',
  rpcUrl: 'wss://xrplcluster.com',
  explorerUrl: 'https://livenet.xrpl.org',
  currency: 'XRP',
  icon: '🔷',
  description: 'XRPL Mainnet with Xaman wallet integration',
  features: ['amm', 'wallet', 'send', 'receive', 'buy-drippy', 'analytics']
}

export const XRPL_TESTNET: NetworkConfig = {
  type: 'xrpl',
  environment: 'testnet',
  name: 'xrpl-testnet',
  displayName: 'XRPL Testnet',
  rpcUrl: 'wss://s.altnet.rippletest.net:51233',
  explorerUrl: 'https://testnet.xrpl.org',
  currency: 'XRP',
  icon: '🔷',
  description: 'XRPL Testnet for testing',
  features: ['amm', 'wallet', 'send', 'receive', 'analytics']
}

export const EVM_MAINNET: NetworkConfig = {
  type: 'evm',
  environment: 'mainnet',
  name: 'xrpl-evm-mainnet',
  displayName: 'XRPL EVM Sidechain',
  chainId: 1440000, // CORRECT: Verified via eth_chainId RPC call (0x15f900)
  rpcUrl: 'https://rpc.xrplevm.org',
  explorerUrl: 'https://explorer.xrplevm.org',
  currency: 'XRP',
  icon: '⚡',
  description: 'XRPL EVM Sidechain for DeFi',
  features: ['wallet', 'swap', 'liquidity', 'nft', 'staking', 'governance', 'analytics']
}

export const EVM_TESTNET: NetworkConfig = {
  type: 'evm',
  environment: 'testnet',
  name: 'xrpl-evm-testnet',
  displayName: 'XRPL EVM Testnet',
  chainId: 1449000, // XRPL EVM Sidechain Testnet - Deployed contracts here!
  rpcUrl: 'https://rpc.testnet.xrplevm.org',
  explorerUrl: 'https://evm-sidechain.xrpl.org',
  currency: 'XRP',
  icon: '⚡',
  description: 'XRPL EVM Testnet with deployed DRIPPY contracts',
  features: ['wallet', 'swap', 'liquidity', 'nft', 'staking', 'governance', 'analytics']
}

export const AVAILABLE_NETWORKS: NetworkConfig[] = [
  XRPL_MAINNET,
  XRPL_TESTNET,
  EVM_MAINNET,
  EVM_TESTNET
]

export function getNetworkByName(name: string): NetworkConfig | undefined {
  return AVAILABLE_NETWORKS.find(n => n.name === name)
}

export function getNetworksByType(type: NetworkType): NetworkConfig[] {
  return AVAILABLE_NETWORKS.filter(n => n.type === type)
}

export function getNetworksByEnvironment(env: NetworkEnvironment): NetworkConfig[] {
  return AVAILABLE_NETWORKS.filter(n => n.environment === env)
}

