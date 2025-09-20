const express = require('express')
const router = express.Router()
const { Client } = require('xahau')

// Hook State Reader - reads actual hook state from Xahau
class HookStateReader {
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

  async getHookState(hookAccount, stateKey) {
    await this.connect()

    try {
      const response = await this.client.request({
        command: 'account_namespace',
        account: hookAccount,
        namespace_id: stateKey
      })

      return response.result?.namespace_entries || []
    } catch (error) {
      console.log(`No state found for key ${stateKey}:`, error.message)
      return []
    }
  }

  async getAllHookStates(hookAccount) {
    await this.connect()

    try {
      const response = await this.client.request({
        command: 'account_objects',
        account: hookAccount,
        type: 'hook_state'
      })

      return response.result?.account_objects || []
    } catch (error) {
      console.log(`Error getting hook states:`, error.message)
      return []
    }
  }

  decodeStateData(hexData) {
    try {
      // Try to decode as uint64 (8 bytes)
      if (hexData.length === 16) {
        return {
          type: 'uint64',
          raw: hexData,
          value: parseInt(hexData, 16),
          xrp: (parseInt(hexData, 16) / 1000000).toString()
        }
      }

      // Try to decode as string
      const str = Buffer.from(hexData, 'hex').toString('utf8')
      if (str.match(/^[\x20-\x7E]*$/)) {
        return {
          type: 'string',
          raw: hexData,
          value: str
        }
      }

      // Return as raw hex
      return {
        type: 'hex',
        raw: hexData,
        value: hexData
      }
    } catch (error) {
      return {
        type: 'error',
        raw: hexData,
        error: error.message
      }
    }
  }
}

const stateReader = new HookStateReader()

// Get enhanced router hook statistics
router.get('/router/stats', async (req, res) => {
  try {
    const routerAccount = process.env.ENHANCED_ROUTER_ACCOUNT

    if (!routerAccount) {
      return res.status(500).json({ error: 'Enhanced router account not configured' })
    }

    const states = await stateReader.getAllHookStates(routerAccount)

    // Parse known state keys
    const stats = {
      account: routerAccount,
      totalDistributed: 0,
      lastDistribution: null,
      nftRewards: 0,
      holderRewards: 0,
      treasuryShare: 0,
      ammDeposits: 0,
      stateEntries: []
    }

    states.forEach(state => {
      const keyHex = state.HookStateKey
      const dataHex = state.HookStateData
      const decoded = stateReader.decodeStateData(dataHex)

      // Convert hex key to string to check for known keys
      const keyStr = Buffer.from(keyHex, 'hex').toString('utf8')

      stats.stateEntries.push({
        key: keyStr,
        keyHex,
        dataHex,
        decoded
      })

      // Parse known keys
      if (keyStr.includes('STATS:TOTAL')) {
        stats.totalDistributed = decoded.value || 0
      } else if (keyStr.includes('LAST_TIME')) {
        stats.lastDistribution = decoded.value ? new Date(decoded.value * 1000).toISOString() : null
      } else if (keyStr.includes('NFT_TOTAL')) {
        stats.nftRewards = decoded.value || 0
      } else if (keyStr.includes('HOLD_TOTAL')) {
        stats.holderRewards = decoded.value || 0
      } else if (keyStr.includes('TREA_TOTAL')) {
        stats.treasuryShare = decoded.value || 0
      } else if (keyStr.includes('AMM_TOTAL')) {
        stats.ammDeposits = decoded.value || 0
      }
    })

    res.json(stats)
  } catch (error) {
    console.error('Error getting router stats:', error)
    res.status(500).json({ error: 'Failed to get router statistics' })
  }
})

// Get claim hook statistics
router.get('/claim/stats', async (req, res) => {
  try {
    const claimAccount = process.env.CLAIM_HOOK_ACCOUNT

    if (!claimAccount) {
      return res.status(500).json({ error: 'Claim hook account not configured' })
    }

    const states = await stateReader.getAllHookStates(claimAccount)

    const stats = {
      account: claimAccount,
      totalUsers: 0,
      totalClaimed: 0,
      userBalances: [],
      stateEntries: []
    }

    states.forEach(state => {
      const keyHex = state.HookStateKey
      const dataHex = state.HookStateData
      const decoded = stateReader.decodeStateData(dataHex)

      const keyStr = Buffer.from(keyHex, 'hex').toString('utf8')

      stats.stateEntries.push({
        key: keyStr,
        keyHex,
        dataHex,
        decoded
      })

      // Check if this is a user balance (DRIPPY: prefix)
      if (keyStr.startsWith('DRIPPY:')) {
        const userAccountHex = keyHex.substring(14) // Remove "DRIPPY:" prefix
        // For now, use the hex as identifier
        stats.userBalances.push({
          accountHex: userAccountHex,
          balance: decoded.value || 0,
          balanceXRP: decoded.xrp || '0'
        })
        stats.totalUsers++
      }
    })

    res.json(stats)
  } catch (error) {
    console.error('Error getting claim stats:', error)
    res.status(500).json({ error: 'Failed to get claim statistics' })
  }
})

// Get utility hook statistics
router.get('/utility/stats', async (req, res) => {
  try {
    const utilityAccount = process.env.UTILITY_HOOK_ACCOUNT

    if (!utilityAccount) {
      return res.status(500).json({ error: 'Utility hook account not configured' })
    }

    const states = await stateReader.getAllHookStates(utilityAccount)

    const stats = {
      account: utilityAccount,
      antiSnipeActive: false,
      antiSnipeEnd: null,
      totalTransactions: 0,
      blockedTransactions: 0,
      stateEntries: []
    }

    states.forEach(state => {
      const keyHex = state.HookStateKey
      const dataHex = state.HookStateData
      const decoded = stateReader.decodeStateData(dataHex)

      const keyStr = Buffer.from(keyHex, 'hex').toString('utf8')

      stats.stateEntries.push({
        key: keyStr,
        keyHex,
        dataHex,
        decoded
      })

      // Parse utility hook specific keys
      if (keyStr.includes('ANTI_SNIPE')) {
        const endTime = decoded.value || 0
        stats.antiSnipeEnd = endTime > 0 ? new Date(endTime * 1000).toISOString() : null
        stats.antiSnipeActive = endTime > Math.floor(Date.now() / 1000)
      }
    })

    res.json(stats)
  } catch (error) {
    console.error('Error getting utility stats:', error)
    res.status(500).json({ error: 'Failed to get utility statistics' })
  }
})

// Get user's claimable balance
router.get('/claim/balance/:account', async (req, res) => {
  try {
    const userAccount = req.params.account
    const claimAccount = process.env.CLAIM_HOOK_ACCOUNT

    if (!claimAccount) {
      return res.status(500).json({ error: 'Claim hook account not configured' })
    }

    // Validate account format
    if (!userAccount.startsWith('r') || userAccount.length < 25) {
      return res.status(400).json({ error: 'Invalid account format' })
    }

    // Create state key: "DRIPPY:" + user account (simplified)
    const stateKey = Buffer.from('DRIPPY:' + userAccount, 'utf8').toString('hex').padEnd(64, '0').toUpperCase()

    const states = await stateReader.getHookState(claimAccount, stateKey)

    let balance = 0
    if (states.length > 0) {
      const stateData = states[0].HookStateData
      const decoded = stateReader.decodeStateData(stateData)
      balance = decoded.value || 0
    }

    res.json({
      account: userAccount,
      claimableBalance: balance,
      claimableBalanceXRP: (balance / 1000000).toString(),
      stateKey
    })
  } catch (error) {
    console.error('Error getting user balance:', error)
    res.status(500).json({ error: 'Failed to get user balance' })
  }
})

// Get all hook deployment info
router.get('/deployment/info', async (req, res) => {
  try {
    const deploymentInfo = {
      network: process.env.DEPLOY_NETWORK || 'testnet',
      hooks: {
        utility: {
          account: process.env.UTILITY_HOOK_ACCOUNT,
          deployed: !!process.env.UTILITY_HOOK_ACCOUNT,
          parameters: {
            ADMIN: process.env.ADMIN_ACCOUNT_HEX,
            TREASURY: process.env.TREASURY_POOL_HEX
          }
        },
        router: {
          account: process.env.ENHANCED_ROUTER_ACCOUNT,
          deployed: !!process.env.ENHANCED_ROUTER_ACCOUNT,
          parameters: {
            NFT_POOL: process.env.NFT_POOL_HEX,
            HOLD_POOL: process.env.HOLDER_POOL_HEX,
            TREA_POOL: process.env.TREASURY_POOL_HEX,
            AMM_POOL: process.env.AMM_POOL_HEX
          }
        },
        claim: {
          account: process.env.CLAIM_HOOK_ACCOUNT,
          deployed: !!process.env.CLAIM_HOOK_ACCOUNT,
          parameters: {
            ADMIN: process.env.ADMIN_ACCOUNT_HEX
          }
        }
      },
      pools: {
        nft: process.env.NFT_POOL_ACCOUNT,
        holder: process.env.HOLDER_POOL_ACCOUNT,
        treasury: process.env.TREASURY_ACCOUNT,
        amm: process.env.AMM_POOL_ACCOUNT
      },
      admin: process.env.HOOK_ADMIN_ACCOUNT
    }

    res.json(deploymentInfo)
  } catch (error) {
    console.error('Error getting deployment info:', error)
    res.status(500).json({ error: 'Failed to get deployment info' })
  }
})

// Manual hook state query
router.post('/state/query', async (req, res) => {
  try {
    const { hookAccount, stateKey } = req.body

    if (!hookAccount || !stateKey) {
      return res.status(400).json({ error: 'Hook account and state key required' })
    }

    const states = await stateReader.getHookState(hookAccount, stateKey)

    const results = states.map(state => ({
      key: state.HookStateKey,
      data: state.HookStateData,
      decoded: stateReader.decodeStateData(state.HookStateData)
    }))

    res.json({
      hookAccount,
      stateKey,
      results
    })
  } catch (error) {
    console.error('Error querying hook state:', error)
    res.status(500).json({ error: 'Failed to query hook state' })
  }
})

// Cleanup on module unload
process.on('exit', async () => {
  await stateReader.disconnect()
})

module.exports = router