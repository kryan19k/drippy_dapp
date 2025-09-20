#!/usr/bin/env node

/**
 * DRIPPY Hook Monitoring & Indexer
 *
 * Monitors all deployed hooks for:
 * - Transaction processing
 * - Hook state changes
 * - Distribution tracking
 * - Error detection
 */

require('dotenv').config()
const { Client } = require('xahau')
const fs = require('fs')
const path = require('path')

class HookMonitor {
  constructor() {
    this.client = null
    this.monitoring = false
    this.stats = {
      totalClaims: 0,
      totalDistributions: 0,
      totalAmount: 0,
      lastActivity: null,
      errors: 0
    }

    this.hooks = {
      utility: {
        account: process.env.UTILITY_HOOK_ACCOUNT,
        name: 'DRIPPY Utility Hook',
        active: true
      },
      router: {
        account: process.env.ENHANCED_ROUTER_ACCOUNT,
        name: 'Enhanced Fee Router',
        active: true
      },
      claim: {
        account: process.env.CLAIM_HOOK_ACCOUNT,
        name: 'Claim Hook',
        active: true
      }
    }
  }

  async start() {
    console.log('🔍 Starting DRIPPY Hook Monitor...')

    try {
      // Connect to Xahau
      this.client = new Client(process.env.XAHAU_WSS, {
        connectionTimeout: 10000
      })
      await this.client.connect()
      console.log('✅ Connected to Xahau testnet')

      // Subscribe to all hook accounts
      await this.subscribeToHooks()

      // Start monitoring
      this.monitoring = true
      console.log('🟢 Hook monitoring active')

      // Periodic health checks
      setInterval(() => this.healthCheck(), 30000)

    } catch (error) {
      console.error('❌ Failed to start hook monitor:', error)
      process.exit(1)
    }
  }

  async subscribeToHooks() {
    const accounts = Object.values(this.hooks)
      .filter(hook => hook.active && hook.account)
      .map(hook => hook.account)

    if (accounts.length === 0) {
      throw new Error('No hook accounts configured')
    }

    console.log('📡 Subscribing to hook accounts:', accounts)

    try {
      // Try subscribing to account changes
      const subscription = {
        command: 'subscribe',
        accounts: accounts
      }

      await this.client.request(subscription)
      console.log('✅ Successfully subscribed to hook accounts')

      // Listen for transactions
      this.client.on('transaction', (tx) => this.handleTransaction(tx))
      this.client.on('ledgerClosed', (ledger) => this.handleLedger(ledger))

    } catch (error) {
      console.log('⚠️  Subscription failed, using polling mode instead')
      console.log('   Error:', error.message)

      // Fallback to polling mode
      await this.startPollingMode()
    }
  }

  async startPollingMode() {
    console.log('📊 Starting polling mode for hook monitoring')

    // Poll every 10 seconds
    setInterval(async () => {
      await this.pollHookAccounts()
    }, 10000)

    // Initial poll
    await this.pollHookAccounts()
  }

  async pollHookAccounts() {
    try {
      for (const [type, hook] of Object.entries(this.hooks)) {
        if (!hook.active || !hook.account) continue

        // Get account info
        const accountInfo = await this.client.request({
          command: 'account_info',
          account: hook.account
        })

        // Simple activity check
        const balance = parseInt(accountInfo.result.account_data.Balance) / 1000000
        console.log(`📋 ${hook.name}: Balance ${balance} XAH`)
      }
    } catch (error) {
      console.log('❌ Polling error:', error.message)
    }
  }

  async handleTransaction(tx) {
    try {
      const { transaction, meta } = tx

      // Skip failed transactions unless they're hook-related
      if (meta.TransactionResult !== 'tesSUCCESS' && !meta.HookExecutions) {
        return
      }

      // Check if transaction involves our hooks
      const hookAccount = this.getHookAccount(transaction)
      if (!hookAccount) return

      console.log(`🎯 Hook transaction detected: ${hookAccount.name}`)
      console.log(`   Hash: ${transaction.hash}`)
      console.log(`   Type: ${transaction.TransactionType}`)

      // Process different hook types
      await this.processHookTransaction(hookAccount, transaction, meta)

      // Update stats
      this.stats.lastActivity = new Date().toISOString()

    } catch (error) {
      console.error('❌ Error handling transaction:', error)
      this.stats.errors++
    }
  }

  getHookAccount(transaction) {
    // Check if transaction is to/from any of our hook accounts
    for (const [type, hook] of Object.entries(this.hooks)) {
      if (hook.account === transaction.Account ||
          hook.account === transaction.Destination) {
        return { type, ...hook }
      }
    }
    return null
  }

  async processHookTransaction(hookAccount, transaction, meta) {
    switch (hookAccount.type) {
      case 'utility':
        await this.processUtilityHook(transaction, meta)
        break
      case 'router':
        await this.processRouterHook(transaction, meta)
        break
      case 'claim':
        await this.processClaimHook(transaction, meta)
        break
    }
  }

  async processUtilityHook(transaction, meta) {
    console.log('🛡️  Utility Hook Activity:')

    if (meta.HookExecutions) {
      meta.HookExecutions.forEach(exec => {
        const returnString = Buffer.from(exec.HookExecution.HookReturnString, 'hex').toString()
        console.log(`   Result: ${returnString}`)

        // Check for anti-sniping activity
        if (returnString.includes('anti')) {
          console.log('   🚨 Anti-sniping protection triggered!')
        }
      })
    }
  }

  async processRouterHook(transaction, meta) {
    console.log('🔀 Router Hook Activity:')

    // Track emissions (distributions)
    if (meta.HookEmissions && meta.HookEmissions.length > 0) {
      console.log(`   📤 ${meta.HookEmissions.length} distributions emitted`)

      this.stats.totalDistributions++

      // Parse amount from transaction
      if (typeof transaction.Amount === 'string') {
        const amount = parseInt(transaction.Amount)
        this.stats.totalAmount += amount
        console.log(`   💰 Amount: ${amount / 1000000} XAH`)
      }

      // Log each emission
      meta.HookEmissions.forEach((emission, i) => {
        console.log(`   Distribution ${i + 1}: ${emission.HookEmission.EmittedTxnID}`)
      })
    }

    // Track hook state changes
    if (meta.HookExecutions) {
      meta.HookExecutions.forEach(exec => {
        if (exec.HookExecution.HookStateChangeCount > 0) {
          console.log(`   📊 State changes: ${exec.HookExecution.HookStateChangeCount}`)
        }
      })
    }
  }

  async processClaimHook(transaction, meta) {
    console.log('🎁 Claim Hook Activity:')

    // Check if it's a claim transaction (has CLAIM memo)
    if (transaction.Memos) {
      const hasClaim = transaction.Memos.some(memo => {
        const memoData = Buffer.from(memo.Memo.MemoData || '', 'hex').toString()
        return memoData.includes('CLAIM')
      })

      if (hasClaim) {
        console.log('   🎯 Claim transaction detected')
        this.stats.totalClaims++

        if (meta.TransactionResult === 'tesSUCCESS') {
          console.log('   ✅ Claim successful')
        } else {
          console.log('   ❌ Claim failed')
          this.stats.errors++
        }
      } else {
        console.log('   💳 Admin deposit detected')
      }
    }
  }

  async handleLedger(ledger) {
    // Log ledger info periodically
    if (ledger.ledger_index % 100 === 0) {
      console.log(`📋 Ledger ${ledger.ledger_index} | Time: ${new Date(ledger.ledger_time * 1000 + 946684800000).toISOString()}`)
    }
  }

  async healthCheck() {
    try {
      // Check connection
      if (!this.client.isConnected()) {
        console.log('⚠️  Connection lost, reconnecting...')
        await this.client.connect()
        await this.subscribeToHooks()
        return
      }

      // Check hook account balances
      for (const [type, hook] of Object.entries(this.hooks)) {
        if (!hook.active || !hook.account) continue

        try {
          const accountInfo = await this.client.request({
            command: 'account_info',
            account: hook.account
          })

          const balance = parseInt(accountInfo.result.account_data.Balance) / 1000000

          // Warn if balance is low
          if (parseFloat(balance) < 10) {
            console.log(`⚠️  ${hook.name} balance low: ${balance} XAH`)
          }

        } catch (error) {
          console.log(`❌ Error checking ${hook.name} balance:`, error.message)
        }
      }

      // Log current stats
      console.log('📊 Current Stats:', {
        claims: this.stats.totalClaims,
        distributions: this.stats.totalDistributions,
        totalAmount: this.stats.totalAmount / 1000000,
        errors: this.stats.errors,
        lastActivity: this.stats.lastActivity
      })

    } catch (error) {
      console.error('❌ Health check failed:', error)
    }
  }

  async getHookStats() {
    return {
      ...this.stats,
      hooks: this.hooks,
      connected: this.client?.isConnected() || false,
      monitoring: this.monitoring
    }
  }

  async stop() {
    console.log('🛑 Stopping hook monitor...')
    this.monitoring = false

    if (this.client) {
      await this.client.disconnect()
    }

    console.log('✅ Hook monitor stopped')
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new HookMonitor()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await monitor.stop()
    process.exit(0)
  })

  // Start monitoring
  monitor.start().catch(console.error)
}

module.exports = HookMonitor