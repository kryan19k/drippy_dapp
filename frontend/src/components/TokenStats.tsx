import React from 'react'
import { motion } from 'framer-motion'
import { 
  Coins, 
  TrendingUp, 
  Shield, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react'
import { useToken } from '../hooks/useToken'
import { useFeeRouter } from '../hooks/useFeeRouter'
import { DRIPPY_TOKEN_ADDRESS, FEE_ROUTER_ADDRESS } from '../../contracts/latest'

export const TokenStats: React.FC = () => {
  const { tokenInfo, balance, isConnected } = useToken()
  const { stats, config, pendingDistribution } = useFeeRouter()

  if (!isConnected) {
    return (
      <div className="card-elevated p-6 rounded-2xl border border-white/5">
        <p className="text-center text-muted-foreground">
          Connect wallet to view token stats
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Token Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-6 rounded-2xl border border-white/5"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center space-x-2">
            <Coins className="w-6 h-6 text-cyan-400" />
            <span>DRIPPY Token</span>
          </h3>
          <a
            href={`https://evm-sidechain.xrpl.org/address/${DRIPPY_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Your Balance */}
          <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
            <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-cyan-400">
              {parseFloat(balance).toLocaleString()} DRIPPY
            </p>
          </div>

          {/* Total Supply */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
            <p className="text-2xl font-bold text-foreground">
              {tokenInfo ? parseFloat(tokenInfo.totalSupply).toLocaleString() : '0'} DRIPPY
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {tokenInfo ? parseFloat(tokenInfo.maxSupply).toLocaleString() : '1B'}
            </p>
          </div>

          {/* Circulating Supply */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Circulating Supply</p>
            <p className="text-xl font-bold text-foreground">
              {tokenInfo ? parseFloat(tokenInfo.circulatingSupply).toLocaleString() : '0'}
            </p>
          </div>

          {/* Tax Rate */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Current Tax Rate</p>
            <p className="text-xl font-bold text-foreground">
              {tokenInfo?.normalTax || 5}%
            </p>
            {tokenInfo?.antiSnipeActive && (
              <p className="text-xs text-yellow-400 mt-1 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Anti-snipe active: {tokenInfo.antiSnipeTax}%</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fee Router Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated p-6 rounded-2xl border border-white/5"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <span>Fee Distribution</span>
          </h3>
          <a
            href={`https://evm-sidechain.xrpl.org/address/${FEE_ROUTER_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Distributed */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Distributed</p>
            <p className="text-xl font-bold text-green-400">
              {stats ? parseFloat(stats.totalDistributed).toLocaleString() : '0'}
            </p>
          </div>

          {/* Pending Distribution */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Pending Distribution</p>
            <p className="text-xl font-bold text-foreground">
              {parseFloat(pendingDistribution).toLocaleString()}
            </p>
          </div>

          {/* Distribution Count */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Distributions</p>
            <p className="text-xl font-bold text-foreground">
              {stats?.distributionCount || 0}
            </p>
          </div>
        </div>

        {/* Pool Allocation */}
        {config && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Pool Allocation:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-muted-foreground">NFT Pool: {config.nftPoolBps}%</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded bg-cyan-500"></div>
                <span className="text-muted-foreground">Token Pool: {config.tokenPoolBps}%</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-muted-foreground">Treasury: {config.treasuryPoolBps}%</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded bg-pink-500"></div>
                <span className="text-muted-foreground">AMM Pool: {config.ammPoolBps}%</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Contract Addresses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-elevated p-6 rounded-2xl border border-white/5"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span>Contract Addresses</span>
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">DRIPPY Token:</span>
            <code className="text-xs text-foreground font-mono">
              {DRIPPY_TOKEN_ADDRESS.slice(0, 6)}...{DRIPPY_TOKEN_ADDRESS.slice(-4)}
            </code>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Fee Router:</span>
            <code className="text-xs text-foreground font-mono">
              {FEE_ROUTER_ADDRESS.slice(0, 6)}...{FEE_ROUTER_ADDRESS.slice(-4)}
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

