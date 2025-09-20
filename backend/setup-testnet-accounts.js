#!/usr/bin/env node

/**
 * DRIPPY Testnet Account Setup Script
 *
 * Creates all required accounts for hook deployment and testing:
 * - Admin account (from existing seed)
 * - Fee Router account
 * - Claim Pool account
 * - NFT Pool account
 * - Holder Pool account
 * - Treasury account
 * - AMM Pool account
 * - Test account
 *
 * Updates .env with all account addresses
 */

require('dotenv').config()
const xrpl = require('xrpl')
const fs = require('fs')
const path = require('path')

// Configuration
const TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233'
const XAHAU_TESTNET_WSS = 'wss://hooks-testnet-v3.xrpl-labs.com'
const MIN_XRP_BALANCE = 100 // XRP to fund each account

// Account roles
const ACCOUNT_ROLES = [
  { name: 'HOOK_FEE_ROUTER_ACCOUNT', description: 'Fee Router Hook Account' },
  { name: 'HOOK_POOL_ACCOUNT', description: 'Claim Pool Account' },
  { name: 'NFT_POOL_ACCOUNT', description: 'NFT Rewards Pool' },
  { name: 'HOLDER_POOL_ACCOUNT', description: 'Holder Rewards Pool' },
  { name: 'TREASURY_ACCOUNT', description: 'Treasury Pool' },
  { name: 'AMM_POOL_ACCOUNT', description: 'AMM Pool' },
  { name: 'DRIPPY_ISSUER', description: 'DRIPPY Token Issuer' },
  { name: 'TEST_ACCOUNT', description: 'Test Account' }
]

async function main() {
  console.log('🚀 DRIPPY Testnet Account Setup')
  console.log('================================')

  try {
    // Connect to XRPL testnet
    console.log('📡 Connecting to XRPL Testnet...')
    const client = new xrpl.Client(TESTNET_WSS)
    await client.connect()
    console.log('✅ Connected to XRPL Testnet')

    // Check existing admin account
    const adminSeed = process.env.HOOK_ADMIN_SEED
    if (!adminSeed) {
      console.log('⚠️  No HOOK_ADMIN_SEED found, generating new admin account...')
      const adminWallet = xrpl.Wallet.generate()
      console.log('🔑 Generated Admin Account:')
      console.log(`   Address: ${adminWallet.classicAddress}`)
      console.log(`   Seed: ${adminWallet.seed}`)
      console.log('   ⚠️  Save this seed in your .env file as HOOK_ADMIN_SEED')
    } else {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed)
      console.log(`🔑 Using existing admin account: ${adminWallet.classicAddress}`)

      // Check admin balance
      try {
        const adminInfo = await client.request({
          command: 'account_info',
          account: adminWallet.classicAddress
        })
        const balance = xrpl.dropsToXrp(adminInfo.result.account_data.Balance)
        console.log(`   💰 Current balance: ${balance} XRP`)

        if (parseFloat(balance) < MIN_XRP_BALANCE) {
          console.log('⚠️  Admin account needs more XRP for funding other accounts')
          console.log(`   🚰 Get testnet XRP: https://test.bithomp.com/explorer/`)
          console.log(`   📋 Admin address: ${adminWallet.classicAddress}`)
        }
      } catch (error) {
        console.log('⚠️  Admin account not found on testnet - needs funding')
        console.log(`   🚰 Get testnet XRP: https://test.bithomp.com/explorer/`)
        console.log(`   📋 Admin address: ${adminWallet.classicAddress}`)
      }
    }

    // Generate all required accounts
    const accounts = {}
    console.log('\\n🏗️  Generating required accounts...')

    for (const role of ACCOUNT_ROLES) {
      const wallet = xrpl.Wallet.generate()
      accounts[role.name] = {
        address: wallet.classicAddress,
        seed: wallet.seed,
        description: role.description
      }
      console.log(`✅ ${role.description}: ${wallet.classicAddress}`)
    }

    // Check if admin can fund accounts
    if (adminSeed) {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed)
      console.log('\\n💰 Attempting to fund accounts...')

      let funded = 0
      for (const [name, account] of Object.entries(accounts)) {
        try {
          // Create and fund account
          const payment = {
            TransactionType: 'Payment',
            Account: adminWallet.classicAddress,
            Destination: account.address,
            Amount: xrpl.xrpToDrops(MIN_XRP_BALANCE.toString())
          }

          const prepared = await client.autofill(payment)
          const signed = adminWallet.sign(prepared)
          const result = await client.submitAndWait(signed.tx_blob)

          if (result.result.meta.TransactionResult === 'tesSUCCESS') {
            console.log(`   ✅ Funded ${account.description}`)
            funded++
          } else {
            console.log(`   ❌ Failed to fund ${account.description}: ${result.result.meta.TransactionResult}`)
          }

          // Small delay between transactions
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.log(`   ❌ Error funding ${account.description}: ${error.message}`)
        }
      }

      console.log(`\\n📊 Successfully funded ${funded}/${ACCOUNT_ROLES.length} accounts`)
    }

    // Update .env file
    console.log('\\n📝 Updating .env file...')
    await updateEnvFile(accounts)

    // Generate summary
    console.log('\\n📋 Account Summary:')
    console.log('===================')

    if (adminSeed) {
      const adminWallet = xrpl.Wallet.fromSeed(adminSeed)
      console.log(`Admin Account: ${adminWallet.classicAddress}`)
    }

    Object.entries(accounts).forEach(([name, account]) => {
      console.log(`${account.description}: ${account.address}`)
    })

    console.log('\\n🎯 Next Steps:')
    console.log('1. Ensure all accounts are funded with testnet XRP')
    console.log('2. Run: npm run hooks:build')
    console.log('3. Run: npm run deploy:testnet')
    console.log('4. Test via admin dashboard at /admin')

    console.log('\\n🚰 Get Testnet XRP:')
    console.log('- https://test.bithomp.com/explorer/')
    console.log('- https://xrpl.org/xrp-testnet-faucet.html')

    await client.disconnect()
    console.log('\\n✅ Setup complete!')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function updateEnvFile(accounts) {
  const envPath = path.join(__dirname, '.env')

  // Read existing .env
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update/add account addresses
  const updates = {
    ...Object.fromEntries(
      Object.entries(accounts).map(([name, account]) => [name, account.address])
    ),
    // Network configuration for testnet
    DEPLOY_NETWORK: 'testnet',
    XAHAU_WSS: 'wss://hooks-testnet-v3.xrpl-labs.com',
    XRPL_WSS: 'wss://s.altnet.rippletest.net:51233',
    XAHAU_NETWORK: 'testnet',
    XRPL_NETWORK: 'testnet',
    DRIPPY_CURRENCY: 'DRIPPY',
    // Hook parameters
    CLAIM_MAX_PER_CLAIM: '1000000000',  // 1000 DRIPPY
    CLAIM_COOLDOWN: '3600',             // 1 hour
    CLAIM_DAILY_MAX: '5000000000',      // 5000 DRIPPY per day
    CLAIM_MIN_AMOUNT: '1000000',        // 1 XRP minimum
    CLAIM_BOOST_MAX: '500',             // 5x maximum boost
    ROUTER_NFT_ALLOC: '40',             // 40%
    ROUTER_HOLD_ALLOC: '30',            // 30%
    ROUTER_TREA_ALLOC: '20',            // 20%
    ROUTER_AMM_ALLOC: '10',             // 10%
    ROUTER_MIN_AMOUNT: '1000000',       // 1 XRP minimum
    ROUTER_FEE_BPS: '100'               // 1%
  }

  // Update existing lines or add new ones
  let updatedContent = envContent
  const addedVars = new Set()

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, `${key}=${value}`)
      addedVars.add(key)
    }
  }

  // Add new variables
  const newVars = Object.entries(updates)
    .filter(([key]) => !addedVars.has(key))
    .map(([key, value]) => `${key}=${value}`)

  if (newVars.length > 0) {
    updatedContent += '\\n\\n# Auto-generated testnet configuration\\n'
    updatedContent += newVars.join('\\n') + '\\n'
  }

  // Write updated .env
  fs.writeFileSync(envPath, updatedContent)
  console.log(`✅ Updated ${envPath} with ${Object.keys(updates).length} variables`)

  // Create seeds backup file
  const seedsPath = path.join(__dirname, '.env.seeds.backup')
  const seedsContent = Object.entries(accounts)
    .map(([name, account]) => `${name}_SEED=${account.seed}`)
    .join('\\n')

  fs.writeFileSync(seedsPath,
    `# BACKUP: Account seeds for testnet\\n` +
    `# Keep this file secure and private!\\n` +
    `# Generated: ${new Date().toISOString()}\\n\\n` +
    seedsContent + '\\n'
  )
  console.log(`✅ Created seeds backup: ${seedsPath}`)
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }