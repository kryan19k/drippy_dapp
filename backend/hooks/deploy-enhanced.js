#!/usr/bin/env node

/**
 * Enhanced DRIPPY Hooks Deployment Script
 *
 * Deploys both Fee Router and Enhanced Claim hooks with proper configuration
 * Supports testnet and mainnet deployment with different parameter sets
 */

require('dotenv').config({ path: '../.env' })
const xrpl = require('xrpl')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  // Network settings
  NETWORK: process.env.DEPLOY_NETWORK || 'testnet', // 'testnet' or 'mainnet'
  WSS_ENDPOINTS: {
    testnet: 'wss://hooks-testnet-v3.xrpl-labs.com',
    mainnet: 'wss://xahau.network'
  },

  // Deployment accounts
  ADMIN_SEED: process.env.HOOK_ADMIN_SEED,

  // Hook accounts (where hooks will be installed)
  CLAIM_POOL_ACCOUNT: process.env.HOOK_POOL_ACCOUNT,
  FEE_ROUTER_ACCOUNT: process.env.HOOK_FEE_ROUTER_ACCOUNT,

  // Pool accounts for fee distribution
  NFT_POOL_ACCOUNT: process.env.NFT_POOL_ACCOUNT,
  HOLDER_POOL_ACCOUNT: process.env.HOLDER_POOL_ACCOUNT,
  TREASURY_ACCOUNT: process.env.TREASURY_ACCOUNT,
  AMM_POOL_ACCOUNT: process.env.AMM_POOL_ACCOUNT,

  // Token configuration
  DRIPPY_ISSUER: process.env.DRIPPY_ISSUER,
  DRIPPY_CURRENCY: process.env.DRIPPY_CURRENCY || 'DRIPPY',

  // Hook parameters
  CLAIM_PARAMS: {
    MAXP: process.env.CLAIM_MAX_PER_CLAIM || '1000000000', // 1000 DRIPPY
    COOLD: process.env.CLAIM_COOLDOWN || '3600', // 1 hour
    DAILY_MAX: process.env.CLAIM_DAILY_MAX || '5000000000', // 5000 DRIPPY per day
    MIN_CLAIM: process.env.CLAIM_MIN_AMOUNT || '1000000', // 1 XRP minimum
    BOOST_MAX: process.env.CLAIM_BOOST_MAX || '500' // 5x maximum boost
  },

  ROUTER_PARAMS: {
    NFT_ALLOC: process.env.ROUTER_NFT_ALLOC || '40',
    HOLD_ALLOC: process.env.ROUTER_HOLD_ALLOC || '30',
    TREA_ALLOC: process.env.ROUTER_TREA_ALLOC || '20',
    AMM_ALLOC: process.env.ROUTER_AMM_ALLOC || '10',
    MIN_AMOUNT: process.env.ROUTER_MIN_AMOUNT || '1000000', // 1 XRP minimum
    FEE_BPS: process.env.ROUTER_FEE_BPS || '100' // 1%
  }
}

// Utility functions
function validateConfig() {
  const required = [
    'ADMIN_SEED',
    'CLAIM_POOL_ACCOUNT',
    'FEE_ROUTER_ACCOUNT',
    'NFT_POOL_ACCOUNT',
    'HOLDER_POOL_ACCOUNT',
    'TREASURY_ACCOUNT',
    'AMM_POOL_ACCOUNT',
    'DRIPPY_ISSUER'
  ]

  const missing = required.filter(key => !CONFIG[key])
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`)
  }

  // Validate allocation percentages
  const total = parseInt(CONFIG.ROUTER_PARAMS.NFT_ALLOC) +
                parseInt(CONFIG.ROUTER_PARAMS.HOLD_ALLOC) +
                parseInt(CONFIG.ROUTER_PARAMS.TREA_ALLOC) +
                parseInt(CONFIG.ROUTER_PARAMS.AMM_ALLOC)

  if (total !== 100) {
    throw new Error(`Router allocations must sum to 100%, got ${total}%`)
  }
}

function loadHookWasm(hookName) {
  const wasmPath = path.join(__dirname, 'build', `${hookName}.wasm`)
  const hexPath = path.join(__dirname, 'build', `${hookName}.wasm.hex`)

  if (!fs.existsSync(hexPath)) {
    throw new Error(`Hook not built: ${hexPath}. Run 'make build-${hookName.split('_')[1]}' first.`)
  }

  const hexData = fs.readFileSync(hexPath, 'utf8').trim().replace(/\n/g, '').toUpperCase()

  if (hexData.length === 0 || hexData.length % 2 !== 0) {
    throw new Error(`Invalid hex data in ${hexPath}`)
  }

  console.log(`Loaded ${hookName}: ${hexData.length / 2} bytes`)
  return hexData
}

function encodeHookParameter(name, value, type = 'string') {
  const nameHex = Buffer.from(name, 'utf8').toString('hex').toUpperCase()

  let valueHex
  switch (type) {
    case 'account':
      // Decode r-address to hex
      if (value.startsWith('r')) {
        valueHex = xrpl.decodeAccountID(value).toString('hex').toUpperCase()
      } else {
        valueHex = value.replace(/^0x/, '').toUpperCase()
      }
      break
    case 'u64':
      const num = BigInt(value)
      valueHex = num.toString(16).padStart(16, '0').toUpperCase()
      break
    case 'u32':
      const num32 = parseInt(value)
      valueHex = num32.toString(16).padStart(8, '0').toUpperCase()
      break
    case 'currency':
      if (value.length <= 3) {
        // Standard currency code
        valueHex = Buffer.from(value, 'utf8').toString('hex').padEnd(40, '0').toUpperCase()
      } else {
        // Hex currency code
        valueHex = value.replace(/^0x/, '').padEnd(40, '0').toUpperCase()
      }
      break
    default:
      valueHex = Buffer.from(value, 'utf8').toString('hex').toUpperCase()
  }

  return {
    HookParameter: {
      HookParameterName: nameHex,
      HookParameterValue: valueHex
    }
  }
}

function buildClaimHookParams() {
  const params = [
    encodeHookParameter('ADMIN', CONFIG.CLAIM_POOL_ACCOUNT, 'account'),
    encodeHookParameter('MAXP', CONFIG.CLAIM_PARAMS.MAXP, 'u64'),
    encodeHookParameter('COOLD', CONFIG.CLAIM_PARAMS.COOLD, 'u64'),
    encodeHookParameter('DAILY_MAX', CONFIG.CLAIM_PARAMS.DAILY_MAX, 'u64'),
    encodeHookParameter('MIN_CLAIM', CONFIG.CLAIM_PARAMS.MIN_CLAIM, 'u64'),
    encodeHookParameter('BOOST_MAX', CONFIG.CLAIM_PARAMS.BOOST_MAX, 'u32')
  ]

  // Add IOU parameters if configured
  if (CONFIG.DRIPPY_ISSUER) {
    params.push(encodeHookParameter('CUR', CONFIG.DRIPPY_CURRENCY, 'currency'))
    params.push(encodeHookParameter('ISSUER', CONFIG.DRIPPY_ISSUER, 'account'))
  }

  return params
}

function buildRouterHookParams() {
  return [
    encodeHookParameter('ADMIN', CONFIG.FEE_ROUTER_ACCOUNT, 'account'),
    encodeHookParameter('NFT_ALLOC', CONFIG.ROUTER_PARAMS.NFT_ALLOC, 'u32'),
    encodeHookParameter('HOLD_ALLOC', CONFIG.ROUTER_PARAMS.HOLD_ALLOC, 'u32'),
    encodeHookParameter('TREA_ALLOC', CONFIG.ROUTER_PARAMS.TREA_ALLOC, 'u32'),
    encodeHookParameter('AMM_ALLOC', CONFIG.ROUTER_PARAMS.AMM_ALLOC, 'u32'),
    encodeHookParameter('NFT_POOL', CONFIG.NFT_POOL_ACCOUNT, 'account'),
    encodeHookParameter('HOLD_POOL', CONFIG.HOLDER_POOL_ACCOUNT, 'account'),
    encodeHookParameter('TREA_POOL', CONFIG.TREASURY_ACCOUNT, 'account'),
    encodeHookParameter('AMM_POOL', CONFIG.AMM_POOL_ACCOUNT, 'account'),
    encodeHookParameter('MIN_AMOUNT', CONFIG.ROUTER_PARAMS.MIN_AMOUNT, 'u64'),
    encodeHookParameter('FEE_BPS', CONFIG.ROUTER_PARAMS.FEE_BPS, 'u32')
  ]
}

async function deployHook(client, wallet, hookAccount, hookWasm, hookParams, hookName) {
  console.log(`\\nDeploying ${hookName} to ${hookAccount}...`)

  const setHookTx = {
    TransactionType: 'SetHook',
    Account: wallet.classicAddress,
    Destination: hookAccount,
    Hooks: [{
      Hook: {
        HookOn: '0x0000000000000000', // All transaction types
        HookNamespace: Buffer.from('DRIPPY', 'utf8').toString('hex').padEnd(64, '0').toUpperCase(),
        HookApiVersion: 0,
        CreateCode: hookWasm,
        HookParameters: hookParams,
        Flags: 1 // hsfOverride
      }
    }]
  }

  console.log(`Parameters: ${hookParams.length} items`)
  hookParams.forEach((param, i) => {
    const name = Buffer.from(param.HookParameter.HookParameterName, 'hex').toString('utf8')
    console.log(`  ${i + 1}. ${name}: ${param.HookParameter.HookParameterValue}`)
  })

  try {
    const prepared = await client.autofill(setHookTx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log(`✅ ${hookName} deployed successfully!`)
      console.log(`   Transaction: ${result.result.hash}`)
      return result
    } else {
      throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`)
    }
  } catch (error) {
    console.error(`❌ Failed to deploy ${hookName}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 DRIPPY Hooks Enhanced Deployment Script')
  console.log(`Network: ${CONFIG.NETWORK}`)
  console.log(`WSS: ${CONFIG.WSS_ENDPOINTS[CONFIG.NETWORK]}`)

  try {
    // Validate configuration
    validateConfig()
    console.log('✅ Configuration validated')

    // Connect to network
    const client = new xrpl.Client(CONFIG.WSS_ENDPOINTS[CONFIG.NETWORK])
    await client.connect()
    console.log('✅ Connected to network')

    // Create wallet from seed
    const wallet = xrpl.Wallet.fromSeed(CONFIG.ADMIN_SEED)
    console.log(`✅ Admin wallet: ${wallet.classicAddress}`)

    // Load hook WASM files
    const claimWasm = loadHookWasm('drippy_enhanced_claim')
    const routerWasm = loadHookWasm('drippy_fee_router')

    // Build hook parameters
    const claimParams = buildClaimHookParams()
    const routerParams = buildRouterHookParams()

    console.log('✅ Hook parameters prepared')

    // Deploy hooks
    const deployments = []

    // Deploy Enhanced Claim Hook
    try {
      const claimResult = await deployHook(
        client, wallet, CONFIG.CLAIM_POOL_ACCOUNT,
        claimWasm, claimParams, 'Enhanced Claim Hook'
      )
      deployments.push({ type: 'claim', result: claimResult })
    } catch (error) {
      console.error('Failed to deploy Claim Hook, continuing with Router...')
    }

    // Deploy Fee Router Hook
    try {
      const routerResult = await deployHook(
        client, wallet, CONFIG.FEE_ROUTER_ACCOUNT,
        routerWasm, routerParams, 'Fee Router Hook'
      )
      deployments.push({ type: 'router', result: routerResult })
    } catch (error) {
      console.error('Failed to deploy Router Hook')
    }

    // Summary
    console.log('\\n📋 Deployment Summary:')
    console.log(`Network: ${CONFIG.NETWORK}`)
    console.log(`Successful deployments: ${deployments.length}/2`)

    deployments.forEach(({ type, result }) => {
      console.log(`  ✅ ${type}: ${result.result.hash}`)
    })

    if (deployments.length === 2) {
      console.log('\\n🎉 All hooks deployed successfully!')
      console.log('\\nNext steps:')
      console.log('1. Test claim functionality via admin dashboard')
      console.log('2. Send test payments to fee router to verify distribution')
      console.log('3. Monitor hook state and transaction emissions')
    } else {
      console.log('\\n⚠️  Some deployments failed. Check logs and retry.')
    }

    await client.disconnect()

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DRIPPY Hooks Enhanced Deployment Script

Usage: node deploy-enhanced.js [options]

Options:
  --network <testnet|mainnet>  Target network (default: testnet)
  --help, -h                   Show this help

Environment Variables:
  Required:
    HOOK_ADMIN_SEED             Seed for admin wallet
    HOOK_POOL_ACCOUNT           Claim pool account address
    HOOK_FEE_ROUTER_ACCOUNT     Fee router account address
    NFT_POOL_ACCOUNT            NFT rewards pool address
    HOLDER_POOL_ACCOUNT         Holder rewards pool address
    TREASURY_ACCOUNT            Treasury account address
    AMM_POOL_ACCOUNT            AMM pool account address
    DRIPPY_ISSUER               DRIPPY token issuer address

  Optional:
    DEPLOY_NETWORK              Target network (testnet/mainnet)
    DRIPPY_CURRENCY             Currency code (default: DRIPPY)
    CLAIM_MAX_PER_CLAIM         Max DRIPPY per claim (default: 1000)
    CLAIM_COOLDOWN              Claim cooldown seconds (default: 3600)
    ROUTER_NFT_ALLOC            NFT allocation % (default: 40)
    ROUTER_HOLD_ALLOC           Holder allocation % (default: 30)
    ROUTER_TREA_ALLOC           Treasury allocation % (default: 20)
    ROUTER_AMM_ALLOC            AMM allocation % (default: 10)

Examples:
  node deploy-enhanced.js
  node deploy-enhanced.js --network mainnet
`)
  process.exit(0)
}

// Override network from command line
const networkArg = process.argv.find((arg, i) => process.argv[i - 1] === '--network')
if (networkArg) {
  CONFIG.NETWORK = networkArg
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { CONFIG, main }