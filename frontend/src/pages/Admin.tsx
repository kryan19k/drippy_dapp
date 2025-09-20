import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useXRPL } from '../contexts/XRPLContext'
import {
  Settings,
  Database,
  Activity,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  Terminal,
  Eye,
  Edit3,
  Plus
} from 'lucide-react'

const Admin: React.FC = () => {
  const { isConnected, account } = useXRPL() as any
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [hookData, setHookData] = useState<any>(null)
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'hooks', label: 'Hook Management', icon: Settings },
    { id: 'accruals', label: 'Accrual Manager', icon: Database },
    { id: 'pools', label: 'Pool Manager', icon: DollarSign },
    { id: 'transactions', label: 'Transactions', icon: Users },
    { id: 'system', label: 'System Logs', icon: Terminal }
  ]

  const fetchRealData = async () => {
    setLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'

      // Fetch all data in parallel
      const [systemRes, deployRes, routerRes, claimRes, utilityRes] = await Promise.allSettled([
        fetch(`${baseUrl}/admin/system/health`, {
          headers: { 'x-admin-account': account || 'rpExedMjjNGVV4SHCh2HWSmia4zZd3mZK2' }
        }),
        fetch(`${baseUrl}/api/hooks/deployment/info`),
        fetch(`${baseUrl}/api/hooks/router/stats`),
        fetch(`${baseUrl}/api/hooks/claim/stats`),
        fetch(`${baseUrl}/api/hooks/utility/stats`)
      ])

      // Parse system health
      if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
        const health = await systemRes.value.json()
        setSystemStatus(health)
      }

      // Parse deployment info
      if (deployRes.status === 'fulfilled' && deployRes.value.ok) {
        const deploy = await deployRes.value.json()
        setDeploymentInfo(deploy)
      }

      // Combine hook stats
      const hookStats: any = {}

      if (routerRes.status === 'fulfilled' && routerRes.value.ok) {
        hookStats.router = await routerRes.value.json()
      }

      if (claimRes.status === 'fulfilled' && claimRes.value.ok) {
        hookStats.claim = await claimRes.value.json()
      }

      if (utilityRes.status === 'fulfilled' && utilityRes.value.ok) {
        hookStats.utility = await utilityRes.value.json()
      }

      // Transform to old format for compatibility
      setHookData({
        claimHook: {
          account: hookStats.claim?.account || 'Not deployed',
          deployed: !!hookStats.claim?.account,
          version: deploymentInfo?.hooks?.claim?.deployed ? '1.0.0' : 'pending',
          lastActivity: hookStats.claim?.account ? '2 minutes ago' : 'Not deployed',
          state: {
            totalAccruals: (hookStats.claim?.totalClaimed || 0).toString(),
            pendingClaims: '0',
            activeUsers: hookStats.claim?.totalUsers || 0
          }
        },
        feeRouterHook: {
          account: hookStats.router?.account || 'Not deployed',
          deployed: !!hookStats.router?.account,
          version: deploymentInfo?.hooks?.router?.deployed ? '1.0.0' : 'pending',
          lastActivity: hookStats.router?.lastDistribution || 'Not active',
          state: {
            totalFees: (hookStats.router?.totalDistributed || 0).toString(),
            routedToday: '0.00',
            allocation: { nft: 40, holders: 30, treasury: 20, amm: 10 }
          }
        }
      })

    } catch (error) {
      console.error('Failed to fetch real data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = fetchRealData

  useEffect(() => {
    if (isConnected) {
      fetchRealData()
      // Refresh every 30 seconds
      const interval = setInterval(fetchRealData, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-2xl max-w-md"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400 mb-6">
            Please connect your admin wallet to access the Drippy administration panel.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage Drippy hooks, pools, and system configuration
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && <OverviewTab systemStatus={systemStatus} hookData={hookData} />}
        {activeTab === 'hooks' && <HookManagementTab hookData={hookData} setHookData={setHookData} />}
        {activeTab === 'accruals' && <AccrualManagerTab />}
        {activeTab === 'pools' && <PoolManagerTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'system' && <SystemLogsTab />}
      </motion.div>
    </div>
  )
}

// Overview Tab Component
const OverviewTab: React.FC<{ systemStatus: any; hookData: any }> = ({ systemStatus, hookData }) => {
  if (!systemStatus || !hookData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading system status...</span>
      </div>
    )
  }

  const statusCards = [
    {
      title: 'Claim Hook',
      status: hookData.claimHook?.deployed ? 'healthy' : 'warning',
      value: hookData.claimHook?.deployed ? 'Deployed' : 'Not Deployed',
      icon: CheckCircle,
      details: `${hookData.claimHook?.state?.activeUsers || 0} active users`
    },
    {
      title: 'Fee Router Hook',
      status: hookData.feeRouterHook?.deployed ? 'healthy' : 'error',
      value: hookData.feeRouterHook?.deployed ? 'Deployed' : 'Pending',
      icon: hookData.feeRouterHook?.deployed ? CheckCircle : XCircle,
      details: 'Core revenue distribution'
    },
    {
      title: 'Indexer Service',
      status: systemStatus.indexer?.status || 'error',
      value: systemStatus.indexer?.running ? 'Running' : 'Stopped',
      icon: systemStatus.indexer?.running ? CheckCircle : XCircle,
      details: 'Real-time monitoring'
    },
    {
      title: 'Total Pool Value',
      status: 'healthy',
      value: `${systemStatus.pools?.nftPool?.balance || 0} XAH`,
      icon: DollarSign,
      details: 'Pool balances from blockchain'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon
          const statusColor = card.status === 'healthy' ? 'text-green-400' :
                            card.status === 'warning' ? 'text-yellow-400' : 'text-red-400'

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-white/5`}>
                  <Icon className={`w-6 h-6 ${statusColor}`} />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                <p className="text-xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-gray-500 text-xs">{card.details}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
            <Upload className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Deploy Fee Router</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors">
            <Plus className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Add Accrual</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">View Logs</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook Management Tab Component
const HookManagementTab: React.FC<{ hookData: any; setHookData: any }> = ({ hookData, setHookData }) => {
  const [deployingRouter, setDeployingRouter] = useState(false)

  if (!hookData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading hook data...</span>
      </div>
    )
  }

  const deployFeeRouter = async () => {
    setDeployingRouter(true)
    try {
      // TODO: Implement actual hook deployment
      await new Promise(resolve => setTimeout(resolve, 3000))
      setHookData((prev: any) => ({
        ...prev,
        feeRouterHook: {
          ...prev.feeRouterHook,
          deployed: true,
          version: '1.0.0',
          lastActivity: 'Just deployed'
        }
      }))
    } catch (error) {
      console.error('Failed to deploy fee router:', error)
    } finally {
      setDeployingRouter(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Claim Hook Management */}
      <div className="glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Claim Hook</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-sm">Deployed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-2">Hook Account</p>
            <p className="text-white font-mono text-sm">{hookData.claimHook.account}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Version</p>
            <p className="text-white">{hookData.claimHook.version}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Accruals</p>
            <p className="text-white text-lg font-semibold">{hookData.claimHook.state.totalAccruals} DRIPPY</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Active Users</p>
            <p className="text-white text-lg font-semibold">{hookData.claimHook.state.activeUsers}</p>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            <span>View State</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Fee Router Hook Management */}
      <div className="glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Fee Router Hook</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${hookData.feeRouterHook.deployed ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${hookData.feeRouterHook.deployed ? 'text-green-400' : 'text-red-400'}`}>
              {hookData.feeRouterHook.deployed ? 'Deployed' : 'Not Deployed'}
            </span>
          </div>
        </div>

        {!hookData.feeRouterHook.deployed ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Fee Router Not Deployed</h4>
            <p className="text-gray-400 mb-6">
              The fee router hook is required for automatic revenue distribution to pools.
            </p>
            <button
              onClick={deployFeeRouter}
              disabled={deployingRouter}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 mx-auto"
            >
              <Upload className="w-5 h-5" />
              <span>{deployingRouter ? 'Deploying...' : 'Deploy Fee Router'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Hook Account</p>
              <p className="text-white font-mono text-sm">{hookData.feeRouterHook.account}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Fees Routed</p>
              <p className="text-white text-lg font-semibold">{hookData.feeRouterHook.state.totalFees} XRP</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Accrual Manager Tab Component
const AccrualManagerTab: React.FC = () => {
  const [targetAccount, setTargetAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('HOLDER')
  const [submitting, setSubmitting] = useState(false)

  const submitAccrual = async () => {
    if (!targetAccount || !amount) return

    setSubmitting(true)
    try {
      // TODO: Implement actual accrual submission
      const response = await fetch('/admin/push-accrual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: targetAccount,
          drops: parseInt(amount) * 1000000, // Convert to drops
          type
        })
      })

      if (response.ok) {
        setTargetAccount('')
        setAmount('')
        // Show success message
      }
    } catch (error) {
      console.error('Failed to submit accrual:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Manual Accrual Form */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Manual Accrual Adjustment</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Target Account</label>
            <input
              type="text"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              placeholder="rAccountAddress..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Amount (DRIPPY)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Accrual Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="HOLDER">Holder Reward</option>
              <option value="NFT">NFT Reward</option>
              <option value="STAKING">Staking Reward</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={submitAccrual}
              disabled={submitting || !targetAccount || !amount}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Add Accrual'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Accruals */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Recent Accruals</h3>
        <div className="space-y-4">
          {/* Recent accruals - TODO: Replace with real API data */}
          {[
            { account: 'rAccount1...', amount: '125.50', type: 'HOLDER', time: '2 min ago' },
            { account: 'rAccount2...', amount: '89.25', type: 'NFT', time: '5 min ago' },
            { account: 'rAccount3...', amount: '234.75', type: 'STAKING', time: '10 min ago' }
          ].map((accrual, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-mono text-sm">{accrual.account}</p>
                <p className="text-gray-400 text-xs">{accrual.time}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">+{accrual.amount} DRIPPY</p>
                <p className="text-gray-400 text-xs">{accrual.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pool Manager Tab Component
const PoolManagerTab: React.FC = () => {
  const [poolData, setPoolData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
        const response = await fetch(`${baseUrl}/admin/system/health`, {
          headers: { 'x-admin-account': 'rpExedMjjNGVV4SHCh2HWSmia4zZd3mZK2' }
        })

        if (response.ok) {
          const data = await response.json()
          setPoolData(data.pools)
        }
      } catch (error) {
        console.error('Failed to fetch pool data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPoolData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading pool data...</span>
      </div>
    )
  }

  const pools = poolData ? [
    {
      name: 'NFT Rewards Pool',
      balance: poolData.nftPool?.balance || '0',
      allocation: '40%',
      status: poolData.nftPool?.status || 'unknown',
      account: poolData.nftPool?.account
    },
    {
      name: 'Holder Rewards Pool',
      balance: poolData.holderPool?.balance || '0',
      allocation: '30%',
      status: poolData.holderPool?.status || 'unknown',
      account: poolData.holderPool?.account
    },
    {
      name: 'Treasury Pool',
      balance: poolData.treasuryPool?.balance || '0',
      allocation: '20%',
      status: poolData.treasuryPool?.status || 'unknown',
      account: poolData.treasuryPool?.account
    },
    {
      name: 'AMM Pool',
      balance: poolData.ammPool?.balance || '0',
      allocation: '10%',
      status: poolData.ammPool?.status || 'unknown',
      account: poolData.ammPool?.account
    }
  ] : []

  return (
    <div className="space-y-6">
      {pools.map((pool) => (
        <div key={pool.name} className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{pool.name}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${pool.status === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className={`text-sm ${pool.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                {pool.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Balance</p>
              <p className="text-white text-xl font-semibold">{pool.balance} XAH</p>
              {pool.account && (
                <p className="text-gray-500 text-xs font-mono mt-1">{pool.account}</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Allocation</p>
              <p className="text-white text-xl font-semibold">{pool.allocation}</p>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm">
                Top Up
              </button>
              <button className="flex-1 px-3 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors text-sm">
                Withdraw
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Transactions Tab Component
const TransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
        const response = await fetch(`${baseUrl}/admin/transactions/recent`, {
          headers: { 'x-admin-account': 'rpExedMjjNGVV4SHCh2HWSmia4zZd3mZK2' }
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Recent Transactions</h3>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-6">Recent Transactions</h3>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No recent transactions found</p>
          </div>
        ) : (
          transactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Activity className={`w-5 h-5 ${
                    tx.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`} />
                </div>
                <div>
                  <p className="text-white font-medium">{tx.type}</p>
                  <p className="text-gray-400 text-sm font-mono">{tx.hash}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{tx.amount}</p>
                <p className="text-gray-400 text-sm">{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : tx.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// System Logs Tab Component
const SystemLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
        const response = await fetch(`${baseUrl}/admin/logs`, {
          headers: { 'x-admin-account': 'rpExedMjjNGVV4SHCh2HWSmia4zZd3mZK2' }
        })

        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-6">System Logs</h3>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading logs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-6">System Logs</h3>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No logs available</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                log.level === 'error' ? 'bg-red-400' :
                log.level === 'warning' ? 'bg-yellow-400' :
                log.level === 'success' ? 'bg-green-400' : 'bg-blue-400'
              }`}></div>
              <div className="flex-1">
                <p className="text-white text-sm">{log.message}</p>
                <p className="text-gray-500 text-xs mt-1">{log.timestamp ? new Date(log.timestamp).toLocaleString() : log.time}</p>
                {log.source && (
                  <p className="text-gray-600 text-xs">Source: {log.source}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Admin