#!/usr/bin/env node

/**
 * Simple DRIPPY Hook Monitor (Xahau Compatible)
 *
 * Uses @bithomp/xrpl-api for better Xahau compatibility
 * Monitors hook accounts using polling instead of websocket subscriptions
 */

require('dotenv').config()
const BitHompApi = require('@bithomp/xrpl-api')

class SimpleHookMonitor {
  constructor() {
    this.api = null
    this.monitoring = false

    this.hooks = {
      utility: {
        account: process.env.UTILITY_HOOK_ACCOUNT,
        name: 'DRIPPY Utility Hook',
        lastBalance: '0'
      },
      router: {
        account: process.env.ENHANCED_ROUTER_ACCOUNT,
        name: 'Enhanced Fee Router',
        lastBalance: '0'
      },
      claim: {
        account: process.env.CLAIM_HOOK_ACCOUNT,
        name: 'Claim Hook',
        lastBalance: '0'
      }
    }

    this.stats = {
      totalPolls: 0,
      lastUpdate: null,
      errors: 0
    }
  }

  async start() {
    console.log('🔍 Starting Simple DRIPPY Hook Monitor...')

    try {
      // Initialize Xahau API using the Client object
      this.api = BitHompApi.Client
      await this.api.setup(process.env.XAHAU_WSS || 'wss://xahau-test.net')
      await this.api.connect()
      console.log('✅ Connected to Xahau using @bithomp/xrpl-api')

      // Start monitoring
      this.monitoring = true
      console.log('🟢 Hook monitoring active (polling mode)')

      // Start polling every 15 seconds
      setInterval(() => {
        this.pollHookAccounts()
      }, 15000)

      // Initial poll
      await this.pollHookAccounts()

      // Health check every 2 minutes
      setInterval(() => {
        this.healthCheck()
      }, 120000)

    } catch (error) {
      console.error('❌ Failed to start simple hook monitor:', error.message)
      process.exit(1)
    }
  }

  async pollHookAccounts() {
    if (!this.monitoring) return

    try {
      this.stats.totalPolls++
      console.log(`\n📊 Poll #${this.stats.totalPolls} - ${new Date().toISOString()}`)

      for (const [type, hook] of Object.entries(this.hooks)) {
        if (!hook.account) {
          console.log(`   ⚠️  ${hook.name}: No account configured`)
          continue
        }

        try {
          // Get account info
          const accountInfo = await this.api.getAccountInfo(hook.account)
          const balance = this.formatXRP(accountInfo.Balance)

          // Check for balance changes
          if (balance !== hook.lastBalance) {
            console.log(`   💰 ${hook.name}: Balance changed ${hook.lastBalance} → ${balance} XAH`)
            hook.lastBalance = balance
          } else {
            console.log(`   ✅ ${hook.name}: ${balance} XAH`)
          }

          // Get recent transactions
          try {
            const transactions = await this.api.getTransactions(hook.account, {
              limit: 3
            })

            if (transactions.length > 0) {
              const latest = transactions[0]
              console.log(`      📋 Latest: ${latest.TransactionType}`)
            }
          } catch (txError) {
            // Ignore transaction errors, just show account balance
          }

        } catch (error) {
          console.log(`   ❌ ${hook.name}: Error - ${error.message}`)
          this.stats.errors++
        }
      }

      this.stats.lastUpdate = new Date().toISOString()

    } catch (error) {
      console.error('❌ Polling error:', error.message)
      this.stats.errors++
    }
  }

  formatXRP(drops) {
    return (parseInt(drops) / 1000000).toFixed(6)
  }

  async healthCheck() {
    console.log('\n💗 Health Check:')
    console.log(`   📊 Total polls: ${this.stats.totalPolls}`)
    console.log(`   ❌ Errors: ${this.stats.errors}`)
    console.log(`   🕐 Last update: ${this.stats.lastUpdate}`)
    console.log(`   🔌 Connected: ${this.api?.isConnected() || false}`)

    // Reconnect if needed
    if (!this.api?.isConnected()) {
      try {
        console.log('🔄 Reconnecting...')
        await this.api.connect()
        console.log('✅ Reconnected successfully')
      } catch (error) {
        console.error('❌ Reconnection failed:', error.message)
      }
    }
  }

  async getStats() {
    return {
      monitoring: this.monitoring,
      hooks: this.hooks,
      stats: this.stats,
      connected: this.api?.isConnected() || false
    }
  }

  async stop() {
    console.log('🛑 Stopping simple hook monitor...')
    this.monitoring = false

    if (this.api) {
      await this.api.disconnect()
    }

    console.log('✅ Simple hook monitor stopped')
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new SimpleHookMonitor()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await monitor.stop()
    process.exit(0)
  })

  // Start monitoring
  monitor.start().catch(console.error)
}

module.exports = SimpleHookMonitor