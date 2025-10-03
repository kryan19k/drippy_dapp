import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  Coins, 
  Clock,
  RefreshCw,
  Droplets,
  Zap,
  Image,
  ArrowRightLeft,
  Shield,
  BarChart3,
  Send,
  ShoppingCart,
  Plus
} from 'lucide-react'
import { useXRPL } from '../contexts/XRPLContext'
import { useEVM } from '../contexts/EVMContext'
import { useNetwork } from '../contexts/NetworkContext'
import XamanPayloadModal from '../components/XamanPayloadModal'
import { useToken } from '../hooks/useToken'
import { TokenStats } from '../components/TokenStats'

const Dashboard: React.FC = () => {
  const { networkType, currentNetwork, environment } = useNetwork()
  
  // XRPL wallet
  const { 
    isConnected: xrplConnected, 
    balance: xrplBalance, 
    drippyBalance, 
    hasDrippyTrustline, 
    refreshBalances: refreshXRPL, 
    requestDrippyTrustline, 
    connectWallet: connectXRPL 
  } = useXRPL() as any
  
  // EVM wallet
  const { 
    isConnected: evmConnected, 
    address: evmAddress, 
    balance: evmBalance,
    connectWallet: connectEVM 
  } = useEVM()
  
  // DRIPPY Token
  const { balance: drippyTokenBalance, tokenInfo } = useToken()
  
  const [signingTrust, setSigningTrust] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)

  // Determine which wallet is connected
  const isConnected = networkType === 'xrpl' ? xrplConnected : evmConnected
  const connectWallet = networkType === 'xrpl' ? connectXRPL : connectEVM

  // Not Connected State
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12 rounded-3xl max-w-2xl w-full border border-white/10"
        >
          {/* Network Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
            networkType === 'xrpl' 
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
              : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
          }`}>
            {networkType === 'xrpl' ? (
              <Droplets className="w-10 h-10 text-blue-400" />
            ) : (
              <Zap className="w-10 h-10 text-purple-400" />
            )}
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3">
            Welcome to Drippy Dashboard
          </h2>
          
          <div className="mb-6">
            <p className="text-lg text-muted-foreground mb-2">
              You're on <span className={`font-semibold ${
                networkType === 'xrpl' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {currentNetwork.displayName}
              </span>
            </p>
            <p className="text-muted-foreground">
              {networkType === 'xrpl' 
                ? 'Connect your Xaman wallet to access AMM trading, manage DRIPPY tokens, and send XRP.'
                : 'Connect your Web3 wallet to access DeFi features: swaps, liquidity pools, NFTs, and staking.'
              }
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {networkType === 'xrpl' ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>AMM Trading</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  <span>Buy DRIPPY</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Send/Receive</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Analytics</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                  <span>Token Swaps</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Droplets className="w-4 h-4 text-pink-400" />
                  <span>Liquidity Pools</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Image className="w-4 h-4 text-purple-400" />
                  <span>NFT Trading</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Coins className="w-4 h-4 text-pink-400" />
                  <span>Staking</span>
                </div>
              </>
            )}
          </div>

          {/* Connect Button */}
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              networkType === 'xrpl'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:shadow-blue-500/50'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50'
            }`}
          >
            {networkType === 'xrpl' ? 'Connect Xaman Wallet' : 'Connect Web3 Wallet'}
          </motion.button>

          <p className="mt-4 text-xs text-muted-foreground">
            {environment === 'testnet' && '⚠️ You\'re on testnet. '}
            Your funds are safe and secure.
          </p>
        </motion.div>
      </div>
    )
  }

  // Connected State - XRPL
  if (networkType === 'xrpl') {
    const drippyValue = hasDrippyTrustline ? (drippyBalance || '0.00') : 'No trustline'

    const stats = [
      {
        title: 'XRP Balance',
        value: xrplBalance || '0.00',
        subtitle: 'XRP',
        icon: Wallet,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10'
      },
      {
        title: 'DRIPPY Balance',
        value: drippyValue,
        subtitle: hasDrippyTrustline ? 'DRIPPY' : 'Set trustline',
        icon: Coins,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10'
      },
      {
        title: 'Pending Rewards',
        value: '25.50',
        subtitle: 'DRIPPY',
        icon: Clock,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10'
      },
      {
        title: 'Total Value',
        value: '$0.00',
        subtitle: 'USD',
        icon: TrendingUp,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10'
      }
    ]

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <Droplets className="w-8 h-8 text-blue-400" />
              <span>XRPL Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentNetwork.displayName} • {environment}
            </p>
          </div>
          <button
            onClick={refreshXRPL}
            className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 glass border border-white/10 hover:border-blue-500/30 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-elevated p-6 rounded-2xl hover:shadow-lg transition-all duration-300 border border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link to="/amm">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">AMM Trading</h3>
                  <p className="text-sm text-muted-foreground">Trade tokens on AMM</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link to="/buy">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Buy DRIPPY</h3>
                  <p className="text-sm text-muted-foreground">Purchase tokens</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link to="/wallet">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Wallet</h3>
                  <p className="text-sm text-muted-foreground">Send & receive XRP</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Trustline Setup */}
        {!hasDrippyTrustline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border-2 border-dashed border-cyan-500/30"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Add DRIPPY Trustline</h3>
                  <p className="text-sm text-muted-foreground">Required to hold DRIPPY tokens</p>
                </div>
              </div>
              <button
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  signingTrust 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg'
                }`}
                onClick={async () => {
                  if (signingTrust) return
                  setSigningTrust(true)
                  try {
                    const res = await requestDrippyTrustline()
                    console.log('TrustSet result', res)
                    if (res?.signed) setTimeout(() => { void refreshXRPL() }, 2000)
                  } catch (e) {
                    console.error(e)
                  } finally {
                    setSigningTrust(false)
                  }
                }}
                disabled={signingTrust}
              >
                {signingTrust ? 'Processing...' : 'Set Trustline'}
              </button>
            </div>
          </motion.div>
        )}

        <XamanPayloadModal
          isOpen={claimOpen}
          onClose={() => setClaimOpen(false)}
          endpoint="/api/xumm/create-claim"
          body={{ network: 'XAHAU' }}
          onResolved={(msg: any) => { if (msg?.signed) setTimeout(() => { void refreshXRPL() }, 2000) }}
        />
      </div>
    )
  }

  // Connected State - EVM
  const stats = [
    {
      title: 'Wallet Balance',
      value: evmBalance || '0.00',
      subtitle: 'XRP',
      icon: Wallet,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'DRIPPY Balance',
      value: drippyTokenBalance ? parseFloat(drippyTokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00',
      subtitle: 'DRIPPY',
      icon: Coins,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'NFTs Owned',
      value: '0',
      subtitle: 'OG NFTs',
      icon: Image,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Current Tax',
      value: tokenInfo ? `${tokenInfo.normalTax}%` : '5%',
      subtitle: tokenInfo?.antiSnipeActive ? 'Anti-Snipe Active!' : 'Normal Rate',
      icon: Shield,
      color: tokenInfo?.antiSnipeActive ? 'text-yellow-400' : 'text-green-400',
      bgColor: tokenInfo?.antiSnipeActive ? 'bg-yellow-500/10' : 'bg-green-500/10'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Zap className="w-8 h-8 text-purple-400" />
            <span>EVM Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentNetwork.displayName} • {environment}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="px-3 py-1.5 glass rounded-lg text-sm">
            <span className="text-muted-foreground">Address: </span>
            <span className="text-foreground font-mono">
              {evmAddress ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-elevated p-6 rounded-2xl hover:shadow-lg transition-all duration-300 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Token Stats */}
      <TokenStats />

      {/* DeFi Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/swap">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Swap Tokens</h3>
                <p className="text-sm text-muted-foreground">Exchange instantly</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/liquidity">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-pink-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Droplets className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Add Liquidity</h3>
                <p className="text-sm text-muted-foreground">Earn fees from trades</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/staking">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Stake Tokens</h3>
                <p className="text-sm text-muted-foreground">Earn rewards</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/nft">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">NFT Marketplace</h3>
                <p className="text-sm text-muted-foreground">Browse collection</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/governance">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-green-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Governance</h3>
                <p className="text-sm text-muted-foreground">Vote on proposals</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/wallet">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="card-elevated p-6 rounded-2xl cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Wallet</h3>
                <p className="text-sm text-muted-foreground">Manage assets</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
