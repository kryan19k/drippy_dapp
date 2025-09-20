import React, { useState } from 'react'
import { motion } from 'framer-motion'
import XamanPayloadModal from '../components/XamanPayloadModal'
import { useXRPL } from '../contexts/XRPLContext'
import { 
  Wallet, 
  TrendingUp, 
  Coins, 
  Clock,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { isConnected, balance, drippyBalance, hasDrippyTrustline, refreshBalances, requestDrippyTrustline, connectWallet } = useXRPL() as any
  const [signingTrust, setSigningTrust] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)

  const drippyValue = hasDrippyTrustline ? (drippyBalance || '0.00') : 'No trustline'

  const stats = [
    {
      title: 'XRP Balance',
      value: balance || '0.00',
      change: '+2.5%',
      changeType: 'positive' as const,
      icon: Wallet,
      color: 'text-blue-400'
    },
    {
      title: 'DRIPPY Balance',
      value: drippyValue,
      change: '+12.3%',
      changeType: 'positive' as const,
      icon: Coins,
      color: 'text-primary-400'
    },
    {
      title: 'Pending Rewards',
      value: '25.50',
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: Clock,
      color: 'text-accent-400'
    },
    {
      title: 'Total APY',
      value: '18.5%',
      change: '+1.8%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-green-400'
    }
  ]

  const recentTransactions = [
    { id: 1, type: 'Reward', amount: '+5.25 DRIPPY', time: '2 min ago', status: 'completed' },
    { id: 2, type: 'Stake', amount: '-100.00 XRP', time: '1 hour ago', status: 'completed' },
    { id: 3, type: 'Reward', amount: '+3.75 DRIPPY', time: '3 hours ago', status: 'completed' },
    { id: 4, type: 'Unstake', amount: '+50.00 XRP', time: '1 day ago', status: 'completed' },
  ]

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-2xl max-w-md"
        >
          <div className="w-16 h-16 drip-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💧</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Drippy</h2>
          <p className="text-gray-400 mb-6">
            Connect your Xaman wallet to start earning rewards and managing your DRIPPY tokens.
          </p>
          <button onClick={connectWallet} className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
            Connect Wallet
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back! Here's your Drippy overview.
          </p>
        </div>
        <button
          onClick={refreshBalances}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors"
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
              className="glass p-6 rounded-xl hover:shadow-drip transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-white/5`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-xl"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.type}</p>
                      <p className="text-gray-400 text-sm">{tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{tx.amount}</p>
                    <p className="text-green-400 text-sm">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass p-6 rounded-xl"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <button onClick={() => setClaimOpen(true)} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                <Coins className="w-5 h-5" />
                <span>Claim Rewards</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 glass text-gray-300 hover:text-white rounded-lg transition-colors">
                <TrendingUp className="w-5 h-5" />
                <span>Stake XRP</span>
              </button>
              {!hasDrippyTrustline && (
              <button
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${signingTrust ? 'glass text-gray-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                onClick={async () => {
                  if (signingTrust) return
                  setSigningTrust(true)
                  try {
                    const res = await requestDrippyTrustline()
                    console.log('TrustSet result', res)
                    if (res?.signed) setTimeout(() => { void refreshBalances() }, 2000)
                  } catch (e) {
                    console.error(e)
                  } finally {
                    setSigningTrust(false)
                  }
                }}
              >
                <Coins className="w-5 h-5" />
                <span>Add DRIPPY Trustline</span>
              </button>
              )}
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 glass text-gray-300 hover:text-white rounded-lg transition-colors">
                <Wallet className="w-5 h-5" />
                <span>View Portfolio</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <XamanPayloadModal
        isOpen={claimOpen}
        onClose={() => setClaimOpen(false)}
        endpoint="/api/xumm/create-claim"
        body={{ network: 'XAHAU' }}
        onResolved={(msg: any) => { if (msg?.signed) setTimeout(() => { void refreshBalances() }, 2000) }}
      />
    </div>
  )
}

export default Dashboard
