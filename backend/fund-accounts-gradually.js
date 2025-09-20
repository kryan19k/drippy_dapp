#!/usr/bin/env node

/**
 * Gradual Account Funding Script
 *
 * Helps manage funding when you can only send 100 XRP per 24 hours
 * - Prioritizes essential accounts first
 * - Allows funding from any funded account to others
 * - Tracks funding progress
 */

require('dotenv').config()
const xrpl = require('xrpl')

const TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233'

// Account priorities (fund in this order)
const FUNDING_PRIORITIES = [
  {
    name: 'Admin Account',
    address: 'rpExedMjjNGVV4SHCh2HWSmia4zZd3mZK2',
    seed: 'sEd7QwisWVSPt77X3F6MaQZ1kNWhKga',
    minAmount: 500, // Need lots for funding others
    priority: 1
  },
  {
    name: 'Fee Router Hook Account',
    address: process.env.HOOK_FEE_ROUTER_ACCOUNT,
    seed: 'sEdSyvaTnWqdyWLGV9afXknZevvyKWn',
    minAmount: 15, // Minimum for hooks
    priority: 2
  },
  {
    name: 'Claim Pool Account',
    address: process.env.HOOK_POOL_ACCOUNT,
    seed: 'sEdT8j33FbWtno5j3pujQbC8aAhfJTw',
    minAmount: 15,
    priority: 2
  },
  {
    name: 'DRIPPY Token Issuer',
    address: process.env.DRIPPY_ISSUER,
    seed: 'sEdSyvmmYNUG1qysTvVAjPzdVb8fyXk',
    minAmount: 50, // For token operations
    priority: 3
  },
  {
    name: 'Treasury Pool',
    address: process.env.TREASURY_ACCOUNT,
    seed: 'sEdVh8vZA74N7JKPzCKGFLAFEykP4Ur',
    minAmount: 20,
    priority: 4
  },
  {
    name: 'NFT Rewards Pool',
    address: process.env.NFT_POOL_ACCOUNT,
    seed: 'sEdSczqhn9hQDd5cxvaDnSoYLC5xvA4',
    minAmount: 15,
    priority: 5
  },
  {
    name: 'Holder Rewards Pool',
    address: process.env.HOLDER_POOL_ACCOUNT,
    seed: 'sEd7bN4KztraEoqaSABndnErEyLadkR',
    minAmount: 15,
    priority: 5
  },
  {
    name: 'AMM Pool',
    address: process.env.AMM_POOL_ACCOUNT,
    seed: 'sEdSzNtEQXeATtLWQtuNuvBmub62qER',
    minAmount: 15,
    priority: 6
  },
  {
    name: 'Test Account',
    address: process.env.TEST_ACCOUNT,
    seed: 'sEdT9nMhynECsPskUo5f4SjEZ5VgEwo',
    minAmount: 10,
    priority: 7
  }
]

async function checkAccountBalance(client, address) {
  try {
    const response = await client.request({
      command: 'account_info',
      account: address
    })
    return parseFloat(xrpl.dropsToXrp(response.result.account_data.Balance))
  } catch (error) {
    return 0 // Account doesn't exist or has no balance
  }
}

async function fundAccount(client, fromSeed, toAddress, amount) {
  try {
    const fromWallet = xrpl.Wallet.fromSeed(fromSeed)

    const payment = {
      TransactionType: 'Payment',
      Account: fromWallet.classicAddress,
      Destination: toAddress,
      Amount: xrpl.xrpToDrops(amount.toString())
    }

    const prepared = await client.autofill(payment)
    const signed = fromWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      return { success: true, hash: result.result.hash }
    } else {
      return { success: false, error: result.result.meta.TransactionResult }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  const command = process.argv[2] || 'status'

  console.log('💰 DRIPPY Testnet Funding Manager')
  console.log('==================================')

  const client = new xrpl.Client(TESTNET_WSS)
  await client.connect()

  // Check status of all accounts
  console.log('📊 Current Account Status:')
  console.log('==========================')

  const accountStatus = []
  for (const account of FUNDING_PRIORITIES) {
    const balance = await checkAccountBalance(client, account.address)
    const funded = balance >= account.minAmount

    accountStatus.push({
      ...account,
      currentBalance: balance,
      funded,
      needed: funded ? 0 : account.minAmount - balance
    })

    const status = funded ? '✅' : '❌'
    const needed = funded ? '' : `(need ${account.minAmount - balance} XRP)`
    console.log(`${status} ${account.name}: ${balance} XRP ${needed}`)
  }

  if (command === 'status') {
    console.log('\\n📋 Funding Strategy:')
    console.log('===================')

    const unfunded = accountStatus.filter(acc => !acc.funded)
    if (unfunded.length === 0) {
      console.log('🎉 All accounts are sufficiently funded!')
    } else {
      console.log('Priority funding order:')
      unfunded
        .sort((a, b) => a.priority - b.priority)
        .forEach((acc, i) => {
          console.log(`${i + 1}. ${acc.name}: ${acc.needed} XRP needed`)
        })

      console.log('\\n💡 Options:')
      console.log('1. Use faucets: npm run fund:faucets')
      console.log('2. Fund from admin: npm run fund:admin')
      console.log('3. Manual funding: Use seeds to import into Xaman')
    }
  }

  if (command === 'admin') {
    console.log('\\n💸 Funding from Admin Account:')
    console.log('==============================')

    const admin = accountStatus[0] // Admin is first
    if (admin.currentBalance < 100) {
      console.log('❌ Admin account needs funding first!')
      console.log(`   Current: ${admin.currentBalance} XRP`)
      console.log(`   Fund admin with faucet: ${admin.address}`)
      await client.disconnect()
      return
    }

    // Fund priority accounts from admin
    const unfunded = accountStatus
      .filter(acc => !acc.funded && acc.name !== 'Admin Account')
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3) // Fund top 3 priority accounts

    console.log(`📤 Funding ${unfunded.length} priority accounts...`)

    for (const account of unfunded) {
      const amount = Math.min(account.needed + 5, 50) // Add buffer, max 50 XRP
      console.log(`\\n💰 Funding ${account.name} with ${amount} XRP...`)

      const result = await fundAccount(client, admin.seed, account.address, amount)

      if (result.success) {
        console.log(`   ✅ Success! Hash: ${result.hash}`)
      } else {
        console.log(`   ❌ Failed: ${result.error}`)
      }

      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  if (command === 'faucets') {
    console.log('\\n🚰 Faucet Funding Strategy:')
    console.log('===========================')

    const unfunded = accountStatus.filter(acc => !acc.funded)
    console.log('Fund these accounts using multiple faucets:')

    const faucets = [
      'https://test.bithomp.com/explorer/',
      'https://xrpl.org/xrp-testnet-faucet.html',
      'https://faucet.altnet.rippletest.net/',
      'https://testnet.xrpl-labs.com/'
    ]

    unfunded.slice(0, 4).forEach((account, i) => {
      console.log(`\\n${i + 1}. ${account.name}`)
      console.log(`   Address: ${account.address}`)
      console.log(`   Faucet: ${faucets[i] || faucets[0]}`)
      console.log(`   Need: ${account.needed} XRP`)
    })
  }

  if (command === 'minimal') {
    console.log('\\n🎯 Minimal Funding for Testing:')
    console.log('===============================')
    console.log('You can start testing with just these 4 accounts:')

    const minimal = [
      accountStatus.find(acc => acc.name === 'Admin Account'),
      accountStatus.find(acc => acc.name === 'Fee Router Hook Account'),
      accountStatus.find(acc => acc.name === 'Claim Pool Account'),
      accountStatus.find(acc => acc.name === 'DRIPPY Token Issuer')
    ]

    minimal.forEach(acc => {
      const status = acc.funded ? '✅' : '❌'
      console.log(`${status} ${acc.name}: ${acc.currentBalance} XRP`)
      if (!acc.funded) {
        console.log(`    Need: ${acc.needed} XRP more`)
        console.log(`    Address: ${acc.address}`)
      }
    })

    const minimalReady = minimal.every(acc => acc.funded)
    if (minimalReady) {
      console.log('\\n🎉 Ready for minimal hook deployment!')
      console.log('Run: npm run deploy:testnet')
    }
  }

  await client.disconnect()
}

// Command help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DRIPPY Testnet Funding Manager

Usage: node fund-accounts-gradually.js [command]

Commands:
  status    Show current funding status (default)
  admin     Fund accounts from admin account
  faucets   Show faucet funding strategy
  minimal   Check minimal accounts for testing

Examples:
  npm run fund:status
  npm run fund:admin
  npm run fund:faucets
  npm run fund:minimal
`)
  process.exit(0)
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }