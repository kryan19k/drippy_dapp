#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const xrpl = require('xrpl');
require('dotenv').config();

// Helper functions for parameter encoding
function toHex(buf) {
    return Buffer.from(buf).toString('hex').toUpperCase();
}

function fromAddress20(addr) {
    return xrpl.decodeAccountID(addr);
}

function u64ToBE(n) {
    const v = BigInt(n);
    const out = Buffer.alloc(8);
    out.writeBigUInt64BE(v);
    return out;
}

function u32ToBE(n) {
    const out = Buffer.alloc(4);
    out.writeUInt32BE(n);
    return out;
}

function param(name, valueHex) {
    return {
        HookParameter: {
            HookParameterName: toHex(Buffer.from(name, 'utf8')),
            HookParameterValue: valueHex
        }
    };
}

async function deployFeeRouterHook() {
    console.log('🚀 Deploying Fee Router Hook to Testnet...\n');

    // Load environment variables
    const adminSeed = process.env.HOOK_ADMIN_SEED;
    const xahauWss = process.env.XAHAU_WSS || 'wss://hooks-testnet-v3.xrpl-labs.com';
    const feeRouterAccount = process.env.HOOK_FEE_ROUTER_ACCOUNT;

    if (!adminSeed || !feeRouterAccount) {
        throw new Error('Required environment variables missing: HOOK_ADMIN_SEED, HOOK_FEE_ROUTER_ACCOUNT');
    }

    // Load compiled hook bytecode
    const wasmHexPath = path.join(__dirname, 'build', 'drippy_fee_router.wasm.hex');
    if (!fs.existsSync(wasmHexPath)) {
        throw new Error(`Hook bytecode not found at: ${wasmHexPath}`);
    }

    const hookHex = fs.readFileSync(wasmHexPath, 'utf8').trim();
    console.log(`📦 Loaded hook bytecode: ${hookHex.length} hex chars`);

    // Connect to Xahau
    const client = new xrpl.Client(xahauWss);
    await client.connect();
    console.log(`🌐 Connected to Xahau: ${xahauWss}`);

    const adminWallet = xrpl.Wallet.fromSeed(adminSeed);
    console.log(`👤 Admin wallet: ${adminWallet.classicAddress}`);

    // Prepare hook parameters
    const hookParams = [
        param('ADMIN', toHex(fromAddress20(adminWallet.classicAddress))),
        param('NFT_ALLOC', toHex(u32ToBE(process.env.ROUTER_NFT_ALLOC || 40))),
        param('HOLD_ALLOC', toHex(u32ToBE(process.env.ROUTER_HOLD_ALLOC || 30))),
        param('TREA_ALLOC', toHex(u32ToBE(process.env.ROUTER_TREA_ALLOC || 20))),
        param('AMM_ALLOC', toHex(u32ToBE(process.env.ROUTER_AMM_ALLOC || 10))),
        param('NFT_POOL', toHex(fromAddress20(process.env.NFT_POOL_ACCOUNT))),
        param('HOLD_POOL', toHex(fromAddress20(process.env.HOLDER_POOL_ACCOUNT))),
        param('TREA_POOL', toHex(fromAddress20(process.env.TREASURY_ACCOUNT))),
        param('AMM_POOL', toHex(fromAddress20(process.env.AMM_POOL_ACCOUNT))),
        param('MIN_AMOUNT', toHex(u64ToBE(process.env.ROUTER_MIN_AMOUNT || 1000000))),
        param('FEE_BPS', toHex(u32ToBE(process.env.ROUTER_FEE_BPS || 100)))
    ];

    console.log('📋 Hook Parameters:');
    hookParams.forEach(p => {
        const name = Buffer.from(p.HookParameter.HookParameterName, 'hex').toString('utf8');
        console.log(`   ${name}: ${p.HookParameter.HookParameterValue}`);
    });

    // Create SetHook transaction
    const setHookTx = {
        TransactionType: 'SetHook',
        Account: adminWallet.classicAddress,
        Destination: feeRouterAccount,
        Hooks: [{
            Hook: {
                HookOn: '0000000000000000000000000000000000000000000000000000000000000001', // ttPAYMENT only
                HookNamespace: Buffer.from('DRIPPY:FEE:ROUTER:v1', 'utf8').toString('hex').padEnd(64, '0').toUpperCase(),
                HookApiVersion: 0,
                CreateCode: hookHex,
                HookParameters: hookParams,
                Flags: 1  // hsfOverride
            }
        }]
    };

    console.log('\n🔨 Preparing SetHook transaction...');

    try {
        const prepared = await client.autofill(setHookTx);
        console.log(`💰 Transaction fee: ${prepared.Fee} drops`);

        const signed = adminWallet.sign(prepared);
        console.log(`🔐 Transaction signed`);

        console.log('\n📡 Submitting to network...');
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
            console.log('✅ Fee Router Hook deployed successfully!');
            console.log(`📄 Transaction hash: ${result.result.hash}`);
            console.log(`🏠 Hook installed on: ${feeRouterAccount}`);
            console.log(`⛽ Fee: ${result.result.Fee} drops`);

            // Verify installation
            console.log('\n🔍 Verifying installation...');
            const accountObjects = await client.request({
                command: 'account_objects',
                account: feeRouterAccount,
                type: 'hook'
            });

            if (accountObjects.result.account_objects.length > 0) {
                console.log('✅ Hook installation verified!');
                const hook = accountObjects.result.account_objects[0];
                console.log(`   Hook ID: ${hook.HookHash}`);
                console.log(`   Hook Namespace: ${hook.HookNamespace}`);
            } else {
                console.log('⚠️  Hook not found in account objects');
            }

        } else {
            console.error('❌ Transaction failed:', result.result.meta?.TransactionResult);
            console.error('Full result:', JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    } finally {
        await client.disconnect();
        console.log('🔌 Disconnected from network');
    }
}

async function main() {
    try {
        await deployFeeRouterHook();
        console.log('\n🎉 Fee Router Hook deployment complete!');
    } catch (error) {
        console.error('\n💥 Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { deployFeeRouterHook };