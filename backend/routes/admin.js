const express = require('express')
const router = express.Router()
const { Client } = require('xahau')
const fs = require('fs').promises
const path = require('path')

// Hook State Reader for real data
class AdminHookReader {
  constructor() {
    this.client = null
  }

  async connect() {
    if (!this.client) {
      this.client = new Client(process.env.XAHAU_WSS, {
        connectionTimeout: 10000
      })
      await this.client.connect()
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect()
      this.client = null
    }
  }

  async getAccountBalance(account) {
    try {
      await this.connect()
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: account
      })
      return (parseInt(accountInfo.result.account_data.Balance) / 1000000).toString()
    } catch (error) {
      return '0'
    }
  }

  async getHookState(hookAccount) {
    try {
      await this.connect()
      const response = await this.client.request({
        command: 'account_objects',
        account: hookAccount,
        type: 'hook_state'
      })
      return response.result?.account_objects || []
    } catch (error) {
      return []
    }
  }
}

const hookReader = new AdminHookReader()

// Mock admin accounts (replace with proper authentication)
const ADMIN_ACCOUNTS = process.env.ADMIN_ACCOUNTS ? process.env.ADMIN_ACCOUNTS.split(',') : []

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  const adminAccount = req.headers['x-admin-account']

  // In production, implement proper authentication
  // For now, accept any connected account as admin for testing
  if (!adminAccount) {
    return res.status(401).json({ error: 'Admin authentication required' })
  }

  // TODO: Implement proper admin verification
  // if (!ADMIN_ACCOUNTS.includes(adminAccount)) {
  //   return res.status(403).json({ error: 'Admin access denied' })
  // }

  req.adminAccount = adminAccount
  next()
}

// Get system health and status
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    // Get real account balances
    const nftBalance = await hookReader.getAccountBalance(process.env.NFT_POOL_ACCOUNT)
    const holderBalance = await hookReader.getAccountBalance(process.env.HOLDER_POOL_ACCOUNT)
    const treasuryBalance = await hookReader.getAccountBalance(process.env.TREASURY_ACCOUNT)
    const ammBalance = await hookReader.getAccountBalance(process.env.AMM_POOL_ACCOUNT)

    const health = {
      timestamp: new Date().toISOString(),
      hooks: {
        utilityHook: {
          deployed: !!process.env.UTILITY_HOOK_ACCOUNT,
          account: process.env.UTILITY_HOOK_ACCOUNT || 'Not deployed',
          status: !!process.env.UTILITY_HOOK_ACCOUNT ? 'healthy' : 'not_deployed',
          lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        routerHook: {
          deployed: !!process.env.ENHANCED_ROUTER_ACCOUNT,
          account: process.env.ENHANCED_ROUTER_ACCOUNT || 'Not deployed',
          status: !!process.env.ENHANCED_ROUTER_ACCOUNT ? 'healthy' : 'not_deployed',
          lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        claimHook: {
          deployed: !!process.env.CLAIM_HOOK_ACCOUNT,
          account: process.env.CLAIM_HOOK_ACCOUNT || 'Not deployed',
          status: !!process.env.CLAIM_HOOK_ACCOUNT ? 'healthy' : 'not_deployed',
          lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      },
      indexer: {
        running: false,
        status: 'not_running',
        lastUpdate: null,
        processedTransactions: 0
      },
      pools: {
        nftPool: {
          balance: nftBalance,
          status: parseFloat(nftBalance) > 10 ? 'healthy' : 'low',
          account: process.env.NFT_POOL_ACCOUNT
        },
        holderPool: {
          balance: holderBalance,
          status: parseFloat(holderBalance) > 10 ? 'healthy' : 'low',
          account: process.env.HOLDER_POOL_ACCOUNT
        },
        treasuryPool: {
          balance: treasuryBalance,
          status: parseFloat(treasuryBalance) > 10 ? 'healthy' : 'low',
          account: process.env.TREASURY_ACCOUNT
        },
        ammPool: {
          balance: ammBalance,
          status: parseFloat(ammBalance) > 10 ? 'healthy' : 'low',
          account: process.env.AMM_POOL_ACCOUNT
        }
      },
      networks: {
        xahau: {
          connected: !!hookReader.client?.isConnected(),
          endpoint: process.env.XAHAU_WSS,
          latency: 67
        }
      }
    }

    res.json(health)
  } catch (error) {
    console.error('Error getting system health:', error)
    res.status(500).json({ error: 'Failed to get system health' })
  }
})

// Get hook deployment status
router.get('/hooks/status', requireAdmin, async (req, res) => {
  try {
    const hookStatus = {
      claimHook: {
        account: process.env.HOOK_POOL_ACCOUNT || 'rDrippyClaimPool123456789',
        deployed: true,
        version: '1.0.0',
        parameters: {
          ADMIN: process.env.HOOK_ADMIN_ACCOUNT || 'rAdminAccount123456789',
          MAXP: '1000000000', // 1000 DRIPPY max per claim
          COOLD: '3600' // 1 hour cooldown
        },
        state: {
          totalAccruals: '45230750000', // in drops
          activeClaims: 156,
          totalClaimed: '12450250000'
        }
      },
      feeRouterHook: {
        account: process.env.HOOK_FEE_ROUTER_ACCOUNT || 'rDrippyFeeRouter123456789',
        deployed: false,
        version: null,
        parameters: null,
        state: null
      }
    }

    res.json(hookStatus)
  } catch (error) {
    console.error('Error getting hook status:', error)
    res.status(500).json({ error: 'Failed to get hook status' })
  }
})

// Get hook state for specific account
router.get('/hooks/state/:account', requireAdmin, async (req, res) => {
  try {
    const account = req.params.account

    // TODO: Implement actual hook state reading from Xahau
    // For now, return mock data
    const mockState = {
      account: account,
      accrualBalance: Math.floor(Math.random() * 1000000000).toString(), // drops
      lastClaimEpoch: Math.floor(Date.now() / 1000) - 3600,
      totalClaimed: Math.floor(Math.random() * 500000000).toString(),
      claimCount: Math.floor(Math.random() * 50)
    }

    res.json(mockState)
  } catch (error) {
    console.error('Error getting account state:', error)
    res.status(500).json({ error: 'Failed to get account state' })
  }
})

// Deploy fee router hook
router.post('/hooks/deploy-router', requireAdmin, async (req, res) => {
  try {
    const { allocation } = req.body || {}

    // Validate allocation percentages
    if (allocation) {
      const total = Object.values(allocation).reduce((sum, val) => sum + val, 0)
      if (total !== 100) {
        return res.status(400).json({ error: 'Allocation percentages must sum to 100' })
      }
    }

    // TODO: Implement actual hook deployment
    // For now, simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 3000))

    const deploymentResult = {
      success: true,
      transactionHash: 'A1B2C3D4E5F6789012345678901234567890ABCDEF',
      hookAccount: process.env.HOOK_FEE_ROUTER_ACCOUNT || 'rDrippyFeeRouter123456789',
      deployment: {
        timestamp: new Date().toISOString(),
        parameters: {
          NFT_ALLOC: allocation?.nft || 40,
          HOLDER_ALLOC: allocation?.holders || 30,
          TREASURY_ALLOC: allocation?.treasury || 20,
          AMM_ALLOC: allocation?.amm || 10
        }
      }
    }

    res.json(deploymentResult)
  } catch (error) {
    console.error('Error deploying fee router:', error)
    res.status(500).json({ error: 'Failed to deploy fee router hook' })
  }
})

// Update hook configuration
router.post('/hooks/configure', requireAdmin, async (req, res) => {
  try {
    const { hookType, parameters } = req.body

    if (!hookType || !parameters) {
      return res.status(400).json({ error: 'Hook type and parameters required' })
    }

    // TODO: Implement actual hook parameter updates
    // This would involve creating new SetHook transactions

    const updateResult = {
      success: true,
      hookType,
      updatedParameters: parameters,
      transactionHash: 'F6E5D4C3B2A1098765432109876543210987654321',
      timestamp: new Date().toISOString()
    }

    res.json(updateResult)
  } catch (error) {
    console.error('Error updating hook configuration:', error)
    res.status(500).json({ error: 'Failed to update hook configuration' })
  }
})

// Get pool balances
router.get('/pools/balances', requireAdmin, async (req, res) => {
  try {
    // TODO: Implement actual balance fetching from XRPL/Xahau
    const balances = {
      nftPool: {
        account: process.env.NFT_POOL_ACCOUNT || 'rNFTPool123456789',
        balance: '45230.75',
        balanceDrops: '45230750000',
        currency: 'DRIPPY',
        issuer: process.env.DRIPPY_ISSUER || 'rDrippyIssuer123456789'
      },
      holderPool: {
        account: process.env.HOLDER_POOL_ACCOUNT || 'rHolderPool123456789',
        balance: '33923.25',
        balanceDrops: '33923250000',
        currency: 'DRIPPY',
        issuer: process.env.DRIPPY_ISSUER || 'rDrippyIssuer123456789'
      },
      treasuryPool: {
        account: process.env.TREASURY_ACCOUNT || 'rTreasury123456789',
        balance: '22615.50',
        balanceDrops: '22615500000',
        currency: 'DRIPPY',
        issuer: process.env.DRIPPY_ISSUER || 'rDrippyIssuer123456789'
      },
      ammPool: {
        account: process.env.AMM_POOL_ACCOUNT || 'rAMMPool123456789',
        balance: '11307.75',
        balanceDrops: '11307750000',
        currency: 'DRIPPY',
        issuer: process.env.DRIPPY_ISSUER || 'rDrippyIssuer123456789'
      }
    }

    res.json(balances)
  } catch (error) {
    console.error('Error getting pool balances:', error)
    res.status(500).json({ error: 'Failed to get pool balances' })
  }
})

// Get recent transactions
router.get('/transactions/recent', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50

    // TODO: Implement actual transaction fetching from XRPL/Xahau
    const mockTransactions = []
    for (let i = 0; i < limit; i++) {
      const types = ['Claim', 'Fee Route', 'Accrual', 'Hook Deploy']
      const type = types[Math.floor(Math.random() * types.length)]

      mockTransactions.push({
        hash: `TX${Math.random().toString(36).substr(2, 20).toUpperCase()}`,
        type,
        account: `r${Math.random().toString(36).substr(2, 25)}`,
        amount: type === 'Fee Route' ?
          `${(Math.random() * 1000 + 100).toFixed(2)} XRP` :
          `${(Math.random() * 500 + 10).toFixed(2)} DRIPPY`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        status: Math.random() > 0.95 ? 'failed' : 'success',
        ledgerIndex: Math.floor(Math.random() * 1000000) + 80000000
      })
    }

    // Sort by timestamp descending
    mockTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      transactions: mockTransactions,
      total: limit,
      page: 1
    })
  } catch (error) {
    console.error('Error getting recent transactions:', error)
    res.status(500).json({ error: 'Failed to get recent transactions' })
  }
})

// Manual accrual adjustment
router.post('/accrual/adjust', requireAdmin, async (req, res) => {
  try {
    const { account, amount, type, reason } = req.body

    if (!account || !amount || !type) {
      return res.status(400).json({ error: 'Account, amount, and type are required' })
    }

    // Validate account format
    if (!account.startsWith('r') || account.length < 25) {
      return res.status(400).json({ error: 'Invalid account format' })
    }

    // Convert amount to drops (assuming input is in DRIPPY)
    const drops = Math.floor(parseFloat(amount) * 1000000)
    if (drops <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' })
    }

    // TODO: Use the existing push-accrual endpoint
    const accrualResult = await fetch(`${req.protocol}://${req.get('host')}/admin/push-accrual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, drops })
    })

    if (!accrualResult.ok) {
      throw new Error('Failed to push accrual to hook')
    }

    const accrualData = await accrualResult.json()

    // Log the adjustment
    const logEntry = {
      timestamp: new Date().toISOString(),
      admin: req.adminAccount,
      account,
      amount,
      type,
      reason: reason || 'Manual adjustment',
      transactionHash: accrualData.meta?.TransactionResult || 'N/A'
    }

    res.json({
      success: true,
      adjustment: logEntry,
      hookResult: accrualData
    })
  } catch (error) {
    console.error('Error adjusting accrual:', error)
    res.status(500).json({ error: error.message || 'Failed to adjust accrual' })
  }
})

// Get system logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const level = req.query.level || 'all'
    const limit = parseInt(req.query.limit) || 100

    // TODO: Implement actual log reading from files or database
    const mockLogs = []
    const levels = ['info', 'warning', 'error', 'success']
    const messages = [
      'Indexer worker started successfully',
      'Claim hook deployed successfully',
      'Fee router hook deployment initiated',
      'AMM pool balance below threshold',
      'Failed to connect to Xahau websocket',
      'Manual accrual adjustment completed',
      'Hook state updated successfully',
      'Treasury pool topped up',
      'Network connection restored',
      'Governance proposal submitted'
    ]

    for (let i = 0; i < limit; i++) {
      const logLevel = levels[Math.floor(Math.random() * levels.length)]
      if (level !== 'all' && logLevel !== level) continue

      mockLogs.push({
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        level: logLevel,
        message: messages[Math.floor(Math.random() * messages.length)],
        source: Math.random() > 0.5 ? 'indexer' : 'hook-manager',
        details: Math.random() > 0.7 ? { extra: 'Additional context data' } : null
      })
    }

    // Sort by timestamp descending
    mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      logs: mockLogs,
      total: mockLogs.length,
      level
    })
  } catch (error) {
    console.error('Error getting logs:', error)
    res.status(500).json({ error: 'Failed to get system logs' })
  }
})

// Pool management - Top up pool
router.post('/pools/:poolType/topup', requireAdmin, async (req, res) => {
  try {
    const { poolType } = req.params
    const { amount, currency } = req.body

    if (!amount || !currency) {
      return res.status(400).json({ error: 'Amount and currency are required' })
    }

    // TODO: Implement actual pool top-up transaction
    const topupResult = {
      success: true,
      poolType,
      amount,
      currency,
      transactionHash: `TOPUP${Math.random().toString(36).substr(2, 20).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      newBalance: (parseFloat(amount) + Math.random() * 10000).toFixed(2)
    }

    res.json(topupResult)
  } catch (error) {
    console.error('Error topping up pool:', error)
    res.status(500).json({ error: 'Failed to top up pool' })
  }
})

// Export hooks source code
router.get('/hooks/source/:hookType', requireAdmin, async (req, res) => {
  try {
    const { hookType } = req.params

    let sourceFile
    switch (hookType) {
      case 'claim':
        sourceFile = 'drippy_claim_hook.c'
        break
      case 'fee-router':
        sourceFile = 'drippy_fee_router.c'
        break
      default:
        return res.status(400).json({ error: 'Invalid hook type' })
    }

    const sourcePath = path.join(__dirname, '..', 'hooks', 'src', sourceFile)

    try {
      const sourceCode = await fs.readFile(sourcePath, 'utf8')
      res.json({
        hookType,
        sourceFile,
        sourceCode,
        lastModified: (await fs.stat(sourcePath)).mtime
      })
    } catch (fileError) {
      res.status(404).json({ error: `Source file not found: ${sourceFile}` })
    }
  } catch (error) {
    console.error('Error getting hook source:', error)
    res.status(500).json({ error: 'Failed to get hook source code' })
  }
})

module.exports = router