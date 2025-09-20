#!/usr/bin/env node

/**
 * DRIPPY Integration Test Suite
 *
 * Tests all three components:
 * 1. Backend API endpoints
 * 2. Hook monitoring
 * 3. Frontend dashboard data flow
 */

require('dotenv').config({ path: './backend/.env' })

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

class IntegrationTester {
  constructor() {
    this.backendUrl = 'http://localhost:8787'
    this.results = {
      backend: {},
      hooks: {},
      monitor: {}
    }
  }

  async runAllTests() {
    log('\n🧪 DRIPPY Integration Test Suite', 'bright')
    log('=' .repeat(50), 'cyan')

    try {
      // Test 1: Backend API Health
      await this.testBackendHealth()

      // Test 2: Hook API Endpoints
      await this.testHookEndpoints()

      // Test 3: Admin Routes
      await this.testAdminRoutes()

      // Test 4: Hook State Reading
      await this.testHookState()

      // Test 5: Environment Configuration
      await this.testEnvironment()

      // Summary
      this.printSummary()

    } catch (error) {
      log(`\n❌ Test suite failed: ${error.message}`, 'red')
      process.exit(1)
    }
  }

  async testBackendHealth() {
    log('\n1. Testing Backend Health...', 'blue')

    try {
      const response = await fetch(`${this.backendUrl}/health`)
      const data = await response.json()

      if (data.ok) {
        log('   ✅ Backend server is running', 'green')
        this.results.backend.health = 'pass'
      } else {
        throw new Error('Health check failed')
      }
    } catch (error) {
      log('   ❌ Backend server is not running', 'red')
      log(`   📋 Start with: cd backend && npm run dev`, 'yellow')
      this.results.backend.health = 'fail'
      throw error
    }
  }

  async testHookEndpoints() {
    log('\n2. Testing Hook API Endpoints...', 'blue')

    const endpoints = [
      '/api/hooks/router/stats',
      '/api/hooks/claim/stats',
      '/api/hooks/utility/stats',
      '/api/hooks/deployment/info'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.backendUrl}${endpoint}`)

        if (response.ok) {
          const data = await response.json()
          log(`   ✅ ${endpoint}`, 'green')
          this.results.hooks[endpoint] = 'pass'

          // Log some key data
          if (endpoint.includes('router')) {
            log(`      💰 Total distributed: ${data.totalDistributed || 0} drops`, 'cyan')
          } else if (endpoint.includes('claim')) {
            log(`      👥 Active users: ${data.totalUsers || 0}`, 'cyan')
          } else if (endpoint.includes('utility')) {
            log(`      🛡️  Anti-snipe: ${data.antiSnipeActive ? 'Active' : 'Inactive'}`, 'cyan')
          } else if (endpoint.includes('deployment')) {
            const deployed = Object.values(data.hooks).filter(h => h.deployed).length
            log(`      🚀 Deployed hooks: ${deployed}/3`, 'cyan')
          }
        } else {
          log(`   ❌ ${endpoint} - Status: ${response.status}`, 'red')
          this.results.hooks[endpoint] = 'fail'
        }
      } catch (error) {
        log(`   ❌ ${endpoint} - Error: ${error.message}`, 'red')
        this.results.hooks[endpoint] = 'error'
      }
    }
  }

  async testAdminRoutes() {
    log('\n3. Testing Admin Routes...', 'blue')

    const adminEndpoints = [
      '/admin/system/health',
      '/admin/hooks/status',
      '/admin/pools/balances'
    ]

    for (const endpoint of adminEndpoints) {
      try {
        const response = await fetch(`${this.backendUrl}${endpoint}`, {
          headers: {
            'x-admin-account': process.env.HOOK_ADMIN_ACCOUNT || 'test-admin'
          }
        })

        if (response.ok) {
          log(`   ✅ ${endpoint}`, 'green')
          this.results.backend[endpoint] = 'pass'
        } else {
          log(`   ❌ ${endpoint} - Status: ${response.status}`, 'red')
          this.results.backend[endpoint] = 'fail'
        }
      } catch (error) {
        log(`   ❌ ${endpoint} - Error: ${error.message}`, 'red')
        this.results.backend[endpoint] = 'error'
      }
    }
  }

  async testHookState() {
    log('\n4. Testing Hook State Reading...', 'blue')

    const routerAccount = process.env.ENHANCED_ROUTER_ACCOUNT
    const claimAccount = process.env.CLAIM_HOOK_ACCOUNT

    if (!routerAccount || !claimAccount) {
      log('   ⚠️  Hook accounts not configured', 'yellow')
      return
    }

    try {
      // Test router state
      const routerResponse = await fetch(`${this.backendUrl}/api/hooks/router/stats`)
      if (routerResponse.ok) {
        const routerData = await routerResponse.json()
        log(`   ✅ Router state read successfully`, 'green')
        log(`      📊 State entries: ${routerData.stateEntries?.length || 0}`, 'cyan')
      }

      // Test claim state
      const claimResponse = await fetch(`${this.backendUrl}/api/hooks/claim/stats`)
      if (claimResponse.ok) {
        const claimData = await claimResponse.json()
        log(`   ✅ Claim state read successfully`, 'green')
        log(`      👥 User balances: ${claimData.userBalances?.length || 0}`, 'cyan')
      }

      this.results.hooks.state = 'pass'
    } catch (error) {
      log(`   ❌ Hook state reading failed: ${error.message}`, 'red')
      this.results.hooks.state = 'fail'
    }
  }

  async testEnvironment() {
    log('\n5. Testing Environment Configuration...', 'blue')

    const requiredVars = [
      'ENHANCED_ROUTER_ACCOUNT',
      'CLAIM_HOOK_ACCOUNT',
      'UTILITY_HOOK_ACCOUNT',
      'XAHAU_WSS',
      'HOOK_ADMIN_ACCOUNT'
    ]

    let missingVars = []

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        log(`   ✅ ${varName}: ${process.env[varName]}`, 'green')
      } else {
        log(`   ❌ ${varName}: Missing`, 'red')
        missingVars.push(varName)
      }
    })

    if (missingVars.length === 0) {
      log('   ✅ All required environment variables are set', 'green')
      this.results.backend.environment = 'pass'
    } else {
      log(`   ❌ Missing ${missingVars.length} environment variables`, 'red')
      this.results.backend.environment = 'fail'
    }
  }

  printSummary() {
    log('\n📋 Test Results Summary', 'bright')
    log('=' .repeat(30), 'cyan')

    const allResults = {
      ...this.results.backend,
      ...this.results.hooks,
      ...this.results.monitor
    }

    const passed = Object.values(allResults).filter(r => r === 'pass').length
    const failed = Object.values(allResults).filter(r => r === 'fail').length
    const errors = Object.values(allResults).filter(r => r === 'error').length
    const total = Object.keys(allResults).length

    log(`\n✅ Passed: ${passed}/${total}`, 'green')
    if (failed > 0) log(`❌ Failed: ${failed}/${total}`, 'red')
    if (errors > 0) log(`⚠️  Errors: ${errors}/${total}`, 'yellow')

    // Integration readiness
    if (passed >= total * 0.8) {
      log('\n🎉 DRIPPY Integration Ready!', 'green')
      log('\nNext steps:', 'bright')
      log('  1. Start backend: cd backend && npm run dev', 'cyan')
      log('  2. Start monitoring: cd backend && npm run monitor:hooks', 'cyan')
      log('  3. Start frontend: cd frontend && npm run dev', 'cyan')
      log('  4. Visit admin dashboard: http://localhost:5173/admin', 'cyan')
    } else {
      log('\n⚠️  Integration needs attention', 'yellow')
      log('\nFix the failed tests above before proceeding', 'yellow')
    }

    log('')
  }
}

// CLI usage
if (require.main === module) {
  const tester = new IntegrationTester()
  tester.runAllTests().catch(console.error)
}

module.exports = IntegrationTester