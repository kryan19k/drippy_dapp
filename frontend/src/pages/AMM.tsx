import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  ArrowDownUp,
  Droplets,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { useXRPL } from '../contexts/XRPLContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const AMM: React.FC = () => {
  const { networkType, environment } = useNetwork()
  const { isConnected, balance, connectWallet } = useXRPL() as any

  const [fromToken, setFromToken] = useState('XRP')
  const [toToken, setToToken] = useState('DRIPPY')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    toast.success('AMM trading coming soon! 🚀')
  }

  const handleFlipTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Not Connected State
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-white/10"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <TrendingUp className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            AMM Trading
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your Xaman wallet to trade on XRPL's Automated Market Maker
          </p>
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
          >
            Connect Xaman Wallet
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <span>AMM Trading</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Trade tokens on XRPL's Automated Market Maker • {environment}
        </p>
      </div>

      {/* Network Warning */}
      {networkType !== 'xrpl' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">Wrong Network</p>
            <p className="text-yellow-400/80 text-sm">
              AMM trading is only available on XRPL Mainnet. Please switch networks.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            {/* Settings Row */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Swap Tokens</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Slippage:</span>
                <input
                  type="text"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 px-2 py-1 bg-muted border border-white/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-muted-foreground">From</label>
              <div className="p-4 bg-muted rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="bg-transparent text-lg font-semibold text-foreground focus:outline-none"
                  >
                    <option value="XRP">XRP</option>
                    <option value="DRIPPY">DRIPPY</option>
                  </select>
                  <span className="text-sm text-muted-foreground">
                    Balance: {balance || '0.00'}
                  </span>
                </div>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleFlipTokens}
                className="p-3 bg-card border-2 border-white/10 hover:border-blue-500/50 rounded-xl transition-all hover:rotate-180 duration-300"
              >
                <ArrowDownUp className="w-5 h-5 text-blue-400" />
              </button>
            </div>

            {/* To Token */}
            <div className="space-y-2 mb-6">
              <label className="text-sm text-muted-foreground">To</label>
              <div className="p-4 bg-muted rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="bg-transparent text-lg font-semibold text-foreground focus:outline-none"
                  >
                    <option value="DRIPPY">DRIPPY</option>
                    <option value="XRP">XRP</option>
                  </select>
                  <span className="text-sm text-muted-foreground">
                    Balance: 0.00
                  </span>
                </div>
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Trade Info */}
            <div className="space-y-2 mb-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="text-foreground font-medium">1 XRP = 0.00 DRIPPY</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className="text-green-400 font-medium">&lt;0.01%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="text-foreground font-medium">~0.00001 XRP</span>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Swap Tokens
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              ⚠️ AMM integration coming soon. This is a preview interface.
            </p>
          </motion.div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Pool Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pool Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">TVL</p>
                <p className="text-xl font-bold text-foreground">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-xl font-bold text-foreground">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">APY</p>
                <p className="text-xl font-bold text-green-400">0.00%</p>
              </div>
            </div>
          </motion.div>

          {/* Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Price Chart</h3>
            </div>
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Chart coming soon</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AMM

