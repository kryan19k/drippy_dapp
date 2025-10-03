import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { useXRPL } from '../contexts/XRPLContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const BuyDrippy: React.FC = () => {
  const { networkType, environment } = useNetwork()
  const { isConnected, balance, connectWallet } = useXRPL() as any

  const [xrpAmount, setXrpAmount] = useState('')
  const [drippyEstimate, setDrippyEstimate] = useState('0.00')
  const [selectedMethod, setSelectedMethod] = useState<'instant' | 'amm'>('instant')

  const handleBuy = () => {
    if (!xrpAmount || parseFloat(xrpAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    toast.success('Purchase coming soon! 🚀')
  }

  const calculateEstimate = (amount: string) => {
    const xrp = parseFloat(amount) || 0
    // Mock calculation - replace with actual rate
    const estimated = xrp * 1000
    setDrippyEstimate(estimated.toFixed(2))
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <ShoppingCart className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Buy DRIPPY
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your Xaman wallet to purchase DRIPPY tokens
          </p>
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
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
          <ShoppingCart className="w-8 h-8 text-cyan-400" />
          <span>Buy DRIPPY</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Purchase DRIPPY tokens directly with XRP • {environment}
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
              DRIPPY purchases are only available on XRPL Mainnet. Please switch networks.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            {/* Method Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedMethod('instant')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === 'instant'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Zap className={`w-6 h-6 mx-auto mb-2 ${
                  selectedMethod === 'instant' ? 'text-cyan-400' : 'text-muted-foreground'
                }`} />
                <p className={`font-semibold ${
                  selectedMethod === 'instant' ? 'text-cyan-400' : 'text-muted-foreground'
                }`}>
                  Instant Buy
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Best rate
                </p>
              </button>

              <button
                onClick={() => setSelectedMethod('amm')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === 'amm'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                  selectedMethod === 'amm' ? 'text-blue-400' : 'text-muted-foreground'
                }`} />
                <p className={`font-semibold ${
                  selectedMethod === 'amm' ? 'text-blue-400' : 'text-muted-foreground'
                }`}>
                  Via AMM
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Decentralized
                </p>
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">You Pay</label>
                <div className="p-4 bg-muted rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-foreground">XRP</span>
                    <span className="text-sm text-muted-foreground">
                      Balance: {balance || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={xrpAmount}
                      onChange={(e) => {
                        setXrpAmount(e.target.value)
                        calculateEstimate(e.target.value)
                      }}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const maxAmount = parseFloat(balance || '0') - 10 // Reserve for fees
                        if (maxAmount > 0) {
                          setXrpAmount(maxAmount.toFixed(2))
                          calculateEstimate(maxAmount.toFixed(2))
                        }
                      }}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="p-2 bg-card border border-white/10 rounded-xl">
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">You Receive (Estimated)</label>
                <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-cyan-400">DRIPPY</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{drippyEstimate}</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 mb-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="text-foreground font-medium">1 XRP = 1,000 DRIPPY</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="text-foreground font-medium">~0.00001 XRP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You'll Receive</span>
                <span className="text-cyan-400 font-bold">{drippyEstimate} DRIPPY</span>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={!xrpAmount || parseFloat(xrpAmount) <= 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {selectedMethod === 'instant' ? 'Buy Now' : 'Buy via AMM'}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              ⚠️ Purchase functionality coming soon. This is a preview interface.
            </p>
          </motion.div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Price Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">DRIPPY Price</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold text-foreground">$0.001</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Change</p>
                <p className="text-lg font-bold text-green-400">+12.5%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold text-foreground">$1.2M</p>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Why Buy DRIPPY?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Earn Rewards</p>
                  <p className="text-xs text-muted-foreground">Passive income from staking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Governance</p>
                  <p className="text-xs text-muted-foreground">Vote on protocol decisions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">NFT Access</p>
                  <p className="text-xs text-muted-foreground">Exclusive NFT benefits</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default BuyDrippy

