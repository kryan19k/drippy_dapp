/**
 * Register Your ORIGINAL DRIPPY Token as a Canonical Interchain Token
 * 
 * This script registers your existing DRIPPY token (0xAb09F142b1550253bAd5F8D4E28592Da0716c62A)
 * as a Canonical Token with Axelar ITS, preserving ALL your custom features:
 * - 5% tax system
 * - Anti-snipe protection
 * - Fee distribution to 4 pools
 * 
 * How it works:
 * 1. Deploys a Lock/Unlock Token Manager on XRPL EVM (home chain)
 * 2. When bridging TO XRPL: Locks tokens on EVM, unlocks wrapped tokens on XRPL
 * 3. When bridging FROM XRPL: Burns wrapped tokens on XRPL, unlocks original tokens on EVM
 * 
 * References:
 * - https://docs.axelar.dev/dev/send-tokens/interchain-tokens/register-existing-token/
 * - https://github.com/axelarnetwork/interchain-token-service/tree/main/contracts
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CONFIG = {
  // XRPL EVM Testnet
  RPC_URL: 'https://rpc.testnet.xrplevm.org',
  CHAIN_ID: 1449000,
  
  // Your ORIGINAL DRIPPY token (with all custom features)
  DRIPPY_TOKEN_ADDRESS: '0xAb09F142b1550253bAd5F8D4E28592Da0716c62A',
  
  // Axelar Testnet Contracts on XRPL EVM
  // NOTE: These are examples - you need to find the ACTUAL addresses for XRPL EVM Testnet
  ITS_FACTORY_ADDRESS: '0x0E7620b73a53980f2138B43314fa944AE990d387', // InterchainTokenFactory address
  ITS_ADDRESS: '0x3b1ca8B18698409fF95e29c506ad7014980F0193', // InterchainTokenService
};

// ABIs
const ITS_FACTORY_ABI = [
  // Register your existing token as canonical
  'function registerCanonicalInterchainToken(address tokenAddress) external payable returns (bytes32 tokenId)',
  
  // Deploy wrapped version on remote chain
  'function deployRemoteCanonicalInterchainToken(address originalTokenAddress, string calldata destinationChain, uint256 gasValue) external payable returns (bytes32 tokenId)',
  
  // Get token ID for a canonical token
  'function canonicalInterchainTokenId(address tokenAddress) external view returns (bytes32 tokenId)',
  
  // Get token manager address
  'function interchainTokenService() external view returns (address)'
];

const DRIPPY_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

async function main() {
  console.log('\n🎯 CANONICAL TOKEN REGISTRATION\n');
  console.log('='.repeat(80));
  console.log('\nRegistering your ORIGINAL DRIPPY token with Axelar ITS');
  console.log('This preserves ALL your custom features!\n');

  // Connect to network
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to: ${network.name || 'XRPL EVM'} (Chain ID: ${network.chainId})\n`);
  } catch (error) {
    console.error('❌ Failed to connect to RPC. Please check your internet connection.');
    console.log('\nℹ️  Alternative RPC endpoints to try:');
    console.log('   - https://rpc-evm-sidechain.peersyst.tech');
    console.log('   - https://rpc.xrplevm.org\n');
    process.exit(1);
  }

  // Load deployer wallet
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env file\n');
    process.exit(1);
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} XRP\n`);

  if (balance < ethers.parseEther('10')) {
    console.warn('⚠️  Warning: Low balance. You need at least 10 XRP for gas.\n');
  }

  // Load contracts
  const drippyToken = new ethers.Contract(
    CONFIG.DRIPPY_TOKEN_ADDRESS,
    DRIPPY_TOKEN_ABI,
    deployer
  );

  // Check if ITS Factory address is configured
  if (!CONFIG.ITS_FACTORY_ADDRESS || CONFIG.ITS_FACTORY_ADDRESS === '0x...') {
    console.log('❌ ERROR: ITS_FACTORY_ADDRESS not configured!\n');
    console.log('📋 To find the correct address:\n');
    console.log('1. Check Axelar docs: https://docs.axelar.dev/resources/contract-addresses/testnet');
    console.log('2. Look for "InterchainTokenFactory" on XRPL EVM Testnet');
    console.log('3. Or ask in Axelar Discord: https://discord.gg/axelar\n');
    console.log('4. Update CONFIG.ITS_FACTORY_ADDRESS in this script\n');
    process.exit(1);
  }

  const itsFactory = new ethers.Contract(
    CONFIG.ITS_FACTORY_ADDRESS,
    ITS_FACTORY_ABI,
    deployer
  );

  // Get token info (skip if RPC has issues)
  console.log('='.repeat(80));
  console.log('\n📊 TOKEN INFORMATION\n');
  
  try {
    const name = await drippyToken.name();
    const symbol = await drippyToken.symbol();
    const decimals = await drippyToken.decimals();
    const totalSupply = await drippyToken.totalSupply();

    console.log(`   Name:         ${name}`);
    console.log(`   Symbol:       ${symbol}`);
    console.log(`   Decimals:     ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    console.log(`   Address:      ${CONFIG.DRIPPY_TOKEN_ADDRESS}\n`);
  } catch (error) {
    console.log('⚠️  Could not read token info (RPC issue), but proceeding...');
    console.log(`   Address:      ${CONFIG.DRIPPY_TOKEN_ADDRESS}`);
    console.log(`   Deployment:   0xb919bbc618a9af62bde3a602985f3230dbb6cb5238c53dd6af8ddeb4a768f70a\n`);
  }

  // Step 1: Check if already registered
  console.log('='.repeat(80));
  console.log('\n🔍 STEP 1: Checking Registration Status\n');

  let tokenId;
  try {
    tokenId = await itsFactory.canonicalInterchainTokenId(CONFIG.DRIPPY_TOKEN_ADDRESS);
    console.log(`✅ Token ID: ${tokenId}\n`);

    // Check if this is the zero/default ID (meaning not registered)
    if (tokenId === ethers.ZeroHash || tokenId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log('ℹ️  Token is NOT yet registered. Proceeding with registration...\n');
    } else {
      console.log('✅ Token is ALREADY registered as a Canonical Token!\n');
      console.log('📝 Add this to your frontend/.env:');
      console.log(`   VITE_CANONICAL_DRIPPY_TOKEN_ID=${tokenId}\n`);
      
      // Ask about deploying to remote chain
      console.log('='.repeat(80));
      console.log('\n🌍 STEP 2: Deploy to Remote Chain (XRPL Mainnet)\n');
      console.log('Would you like to deploy the wrapped token to XRPL now? (y/n)\n');
      console.log('ℹ️  This will cost additional gas (~6 XRP)\n');
      
      // For automation, we'll skip asking and just show the command
      console.log('To deploy to XRPL Mainnet, run:');
      console.log('   node deploy-remote-canonical.js\n');
      
      return tokenId;
    }
  } catch (error) {
    console.log('⏳ Token not yet registered. Proceeding with registration...\n');
  }

  // Step 2: Register as Canonical Token
  console.log('='.repeat(80));
  console.log('\n📝 STEP 2: Registering as Canonical Token\n');
  console.log('This will:\n');
  console.log('  ✓ Deploy a Lock/Unlock Token Manager on XRPL EVM');
  console.log('  ✓ Link it to your DRIPPY token');
  console.log('  ✓ Preserve ALL your custom features (tax, anti-snipe, etc.)');
  console.log('  ✓ Return a unique tokenId\n');

  try {
    console.log('⏳ Submitting registration transaction...\n');

    const tx = await itsFactory.registerCanonicalInterchainToken(
      CONFIG.DRIPPY_TOKEN_ADDRESS,
      {
        gasLimit: 500000,
        value: ethers.parseEther('6') // Gas for Axelar
      }
    );

    console.log(`   TX Hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log(`✅ Registration confirmed in block ${receipt.blockNumber}!\n`);

    // Get the token ID
    tokenId = await itsFactory.canonicalInterchainTokenId(CONFIG.DRIPPY_TOKEN_ADDRESS);
    console.log(`🎉 Token ID: ${tokenId}\n`);

  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    
    if (error.message.includes('already registered')) {
      console.log('\nℹ️  Token might already be registered. Fetching tokenId...\n');
      tokenId = await itsFactory.canonicalInterchainTokenId(CONFIG.DRIPPY_TOKEN_ADDRESS);
      console.log(`Token ID: ${tokenId}\n`);
    } else {
      console.log('\nTroubleshooting:');
      console.log('  1. Check you have enough XRP for gas');
      console.log('  2. Verify ITS_FACTORY_ADDRESS is correct');
      console.log('  3. Try increasing gas limit\n');
      process.exit(1);
    }
  }

  // Step 3: Summary and Next Steps
  console.log('='.repeat(80));
  console.log('\n🎉 REGISTRATION COMPLETE!\n');
  console.log('='.repeat(80));

  console.log('\n📝 Configuration Updates:\n');
  console.log('1. Add to frontend/.env:');
  console.log(`   VITE_CANONICAL_DRIPPY_TOKEN_ID=${tokenId}`);
  console.log(`   VITE_DRIPPY_TOKEN_ADDRESS=${CONFIG.DRIPPY_TOKEN_ADDRESS}\n`);

  console.log('2. Update frontend/contracts/latest.ts:');
  console.log(`   export const DRIPPY_TOKEN_ADDRESS = '${CONFIG.DRIPPY_TOKEN_ADDRESS}' as \`0x\${string}\`\n`);

  console.log('3. Update useBridge.ts (line 12):');
  console.log(`   const DRIPPY_TOKEN_ID_TESTNET = '${tokenId}' as \`0x\${string}\`\n`);

  console.log('='.repeat(80));
  console.log('\n🌍 NEXT STEP: Deploy to XRPL Mainnet\n');
  console.log('To make your token bridgeable to XRPL, you need to deploy the');
  console.log('wrapped version on XRPL Mainnet.\n');
  
  console.log('Run: node deploy-remote-canonical.js\n');
  console.log('This will:');
  console.log('  ✓ Deploy wrapped DRIPPY on XRPL');
  console.log('  ✓ Connect it to your canonical token');
  console.log('  ✓ Enable cross-chain bridging\n');

  console.log('='.repeat(80));
  console.log('\n✨ Your ORIGINAL DRIPPY token is now ITS-enabled! ✨\n');

  return tokenId;
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { main };

