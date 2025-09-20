import { useState, useEffect } from 'react'
import { AlertCircle, Activity, Zap, TrendingUp, Clock, DollarSign } from 'lucide-react'

interface HookStats {
  account: string
  totalDistributed?: number
  lastDistribution?: string
  nftRewards?: number
  holderRewards?: number
  treasuryShare?: number
  ammDeposits?: number
  stateEntries?: Array<{
    key: string
    keyHex: string
    dataHex: string
    decoded: any
  }>
}

interface ClaimStats {
  account: string
  totalUsers?: number
  totalClaimed?: number
  userBalances?: Array<{
    account: string
    balance: number
    balanceXRP: string
  }>
  stateEntries?: Array<{
    key: string
    keyHex: string
    dataHex: string
    decoded: any
  }>
}

interface UtilityStats {
  account: string
  antiSnipeActive?: boolean
  antiSnipeEnd?: string | null
  totalTransactions?: number
  blockedTransactions?: number
}

export default function HookDashboard() {
  const [routerStats, setRouterStats] = useState<HookStats | null>(null)
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [utilityStats, setUtilityStats] = useState<UtilityStats | null>(null)
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHookStats = async () => {
    try {
      setLoading(true)
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'

      // Fetch all hook statistics in parallel
      const [routerRes, claimRes, utilityRes, deployRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/hooks/router/stats`),
        fetch(`${baseUrl}/api/hooks/claim/stats`),
        fetch(`${baseUrl}/api/hooks/utility/stats`),
        fetch(`${baseUrl}/api/hooks/deployment/info`)
      ])

      // Parse router stats
      if (routerRes.status === 'fulfilled' && routerRes.value.ok) {
        const router = await routerRes.value.json()
        setRouterStats(router)
      }

      // Parse claim stats
      if (claimRes.status === 'fulfilled' && claimRes.value.ok) {
        const claim = await claimRes.value.json()
        setClaimStats(claim)
      }

      // Parse utility stats
      if (utilityRes.status === 'fulfilled' && utilityRes.value.ok) {
        const utility = await utilityRes.value.json()
        setUtilityStats(utility)
      }

      // Parse deployment info
      if (deployRes.status === 'fulfilled' && deployRes.value.ok) {
        const deploy = await deployRes.value.json()
        setDeploymentInfo(deploy)
      }

      setError(null)
    } catch (err) {
      setError('Failed to fetch hook statistics')
      console.error('Error fetching hook stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHookStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHookStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatXRP = (drops: number) => {
    return (drops / 1000000).toFixed(6)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading hook statistics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={fetchHookStats}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hook Dashboard</h1>
        <button
          onClick={fetchHookStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Deployment Status */}
      {deploymentInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Deployment Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${deploymentInfo.hooks.utility.deployed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-sm font-medium">Utility Hook</div>
              <div className="text-xs text-gray-500 truncate">{deploymentInfo.hooks.utility.account || 'Not deployed'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${deploymentInfo.hooks.router.deployed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-sm font-medium">Router Hook</div>
              <div className="text-xs text-gray-500 truncate">{deploymentInfo.hooks.router.account || 'Not deployed'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${deploymentInfo.hooks.claim.deployed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-sm font-medium">Claim Hook</div>
              <div className="text-xs text-gray-500 truncate">{deploymentInfo.hooks.claim.account || 'Not deployed'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Router Hook Stats */}
      {routerStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Enhanced Router Hook
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatXRP(routerStats.totalDistributed || 0)}</div>
              <div className="text-sm text-gray-600">Total Distributed (XAH)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold">{formatXRP(routerStats.nftRewards || 0)}</div>
              <div className="text-sm text-gray-600">NFT Rewards</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold">{formatXRP(routerStats.holderRewards || 0)}</div>
              <div className="text-sm text-gray-600">Holder Rewards</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold">{formatXRP(routerStats.ammDeposits || 0)}</div>
              <div className="text-sm text-gray-600">AMM Deposits</div>
            </div>
          </div>
          {routerStats.lastDistribution && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Last Distribution: {formatTimeAgo(routerStats.lastDistribution)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Utility Hook Stats */}
      {utilityStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Utility Hook
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className={`text-2xl font-bold ${utilityStats.antiSnipeActive ? 'text-red-500' : 'text-green-500'}`}>
                {utilityStats.antiSnipeActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
              <div className="text-sm text-gray-600">Anti-Sniping</div>
              {utilityStats.antiSnipeEnd && (
                <div className="text-xs text-gray-500 mt-1">
                  Ends: {new Date(utilityStats.antiSnipeEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold">{utilityStats.totalTransactions || 0}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold">{utilityStats.blockedTransactions || 0}</div>
              <div className="text-sm text-gray-600">Blocked Transactions</div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Hook Stats */}
      {claimStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            Claim Hook
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold">{claimStats.totalUsers || 0}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold">{formatXRP(claimStats.totalClaimed || 0)}</div>
              <div className="text-sm text-gray-600">Total Claimed (XAH)</div>
            </div>
          </div>

          {/* User Balances */}
          {claimStats.userBalances && claimStats.userBalances.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium mb-3">User Balances</h3>
              <div className="max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {claimStats.userBalances.slice(0, 10).map((user, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono truncate">{user.account}</span>
                      <span className="text-sm font-semibold">{user.balanceXRP} XAH</span>
                    </div>
                  ))}
                  {claimStats.userBalances.length > 10 && (
                    <div className="text-center text-sm text-gray-500 p-2">
                      ... and {claimStats.userBalances.length - 10} more users
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw State Data (Debug) */}
      <details className="bg-gray-50 rounded-lg p-4">
        <summary className="font-medium cursor-pointer">Raw Hook State Data (Debug)</summary>
        <div className="mt-4 space-y-4">
          {routerStats?.stateEntries && (
            <div>
              <h4 className="font-medium">Router Hook State:</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(routerStats.stateEntries, null, 2)}
              </pre>
            </div>
          )}
          {claimStats?.stateEntries && (
            <div>
              <h4 className="font-medium">Claim Hook State:</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(claimStats.stateEntries, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}