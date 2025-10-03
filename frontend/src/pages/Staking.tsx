import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Coins,
  Lock,
  Unlock,
  TrendingUp,
  AlertCircle,
  Zap
} from 'lucide-react'
import { useEVM } from '../contexts/EVMContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const Staking: React.FC = () => {
  const { networkType, environment } = useNetwork()
  const { isConnected, connectWallet } = useEVM()

  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedPool, setSelectedPool] = useState('flexible')

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    toast.success('Staking coming soon! 🚀')
  }


  const handleClaim = () => {
    toast.success('Claiming rewards coming soon! 🚀')
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Coins className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Staking
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your Web3 wallet to stake DRIPPY and earn rewards
          </p>
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
          >
            Connect Web3 Wallet
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          <Coins className="w-8 h-8 text-blue-400" />
          <span>Staking</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Stake DRIPPY tokens and earn rewards • {environment}
        </p>
      </div>

      {/* Network Warning */}
      {networkType !== 'evm' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">Wrong Network</p>
            <p className="text-yellow-400/80 text-sm">
              Staking is only available on XRPL EVM Sidechain. Please switch networks.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 rounded-xl border border-white/5"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-muted-foreground">Your Stake</p>
          </div>
          <p className="text-2xl font-bold text-foreground">0.00</p>
          <p className="text-xs text-muted-foreground">DRIPPY</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 rounded-xl border border-white/5"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-green-400" />
            <p className="text-sm text-muted-foreground">Rewards Earned</p>
          </div>
          <p className="text-2xl font-bold text-green-400">0.00</p>
          <p className="text-xs text-muted-foreground">DRIPPY</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-4 rounded-xl border border-white/5"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-sm text-muted-foreground">APY</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">18.5%</p>
          <p className="text-xs text-green-400">↑ 2.3%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-4 rounded-xl border border-white/5"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            <p className="text-sm text-muted-foreground">Total Staked</p>
          </div>
          <p className="text-2xl font-bold text-foreground">1.2M</p>
          <p className="text-xs text-muted-foreground">DRIPPY</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staking Card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-elevated rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Tab Headers */}
            <div className="flex border-b border-white/5">
              {(['stake', 'unstake'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-semibold capitalize transition-all flex items-center justify-center space-x-2 ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {tab === 'stake' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'stake' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Pool Selection */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Select Pool</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedPool('flexible')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPool === 'flexible'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Zap className={`w-6 h-6 mx-auto mb-2 ${
                          selectedPool === 'flexible' ? 'text-blue-400' : 'text-muted-foreground'
                        }`} />
                        <p className={`font-semibold text-sm ${
                          selectedPool === 'flexible' ? 'text-blue-400' : 'text-muted-foreground'
                        }`}>
                          Flexible
                        </p>
                        <p className="text-xs text-green-400 mt-1">12% APY</p>
                        <p className="text-xs text-muted-foreground">Unlock anytime</p>
                      </button>

                      <button
                        onClick={() => setSelectedPool('locked')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPool === 'locked'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Lock className={`w-6 h-6 mx-auto mb-2 ${
                          selectedPool === 'locked' ? 'text-purple-400' : 'text-muted-foreground'
                        }`} />
                        <p className={`font-semibold text-sm ${
                          selectedPool === 'locked' ? 'text-purple-400' : 'text-muted-foreground'
                        }`}>
                          Locked (30d)
                        </p>
                        <p className="text-xs text-green-400 mt-1">25% APY</p>
                        <p className="text-xs text-muted-foreground">Higher rewards</p>
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Amount to Stake</label>
                    <div className="p-4 bg-muted rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold text-foreground">DRIPPY</span>
                        <span className="text-sm text-muted-foreground">
                          Balance: 0.00
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                        />
                        <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition-colors">
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Staking Info */}
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">APY</span>
                      <span className="text-green-400 font-bold">
                        {selectedPool === 'flexible' ? '12%' : '25%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lock Period</span>
                      <span className="text-foreground font-medium">
                        {selectedPool === 'flexible' ? 'None' : '30 days'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Daily Rewards</span>
                      <span className="text-foreground font-medium">0.00 DRIPPY</span>
                    </div>
                  </div>

                  {/* Stake Button */}
                  <button
                    onClick={handleStake}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg"
                  >
                    Stake DRIPPY
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Staking smart contracts coming soon. This is a preview interface.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No active stakes</p>
                  <p className="text-sm text-muted-foreground">
                    Stake DRIPPY to start earning rewards
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Rewards Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Claimable Rewards</h3>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-green-400 mb-2">0.00</p>
              <p className="text-sm text-muted-foreground mb-4">DRIPPY</p>
              <button
                onClick={handleClaim}
                disabled
                className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Claim Rewards
              </button>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Pool Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Value Locked</p>
                <p className="text-xl font-bold text-foreground">$2.4M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stakers</p>
                <p className="text-xl font-bold text-foreground">1,234</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rewards Distributed</p>
                <p className="text-xl font-bold text-green-400">125K DRIPPY</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Staking

