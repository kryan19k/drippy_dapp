/**
 * Deploy Remote Canonical Token on XRPL Mainnet
 * 
 * After registering your token on XRPL EVM (home chain), this script
 * deploys the wrapped version on XRPL Mainnet for cross-chain bridging.
 * 
 * Prerequisites:
 * 1. Run register-canonical-token.js first
 * 2. Have the tokenId from registration
 * 3. Have XRP for gas (~6 XRP)
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CONFIG = {
  // XRPL EVM Testnet
  RPC_URL: 'https://rpc-evm-sidechain.xrpl.org',
  CHAIN_ID: 1449000,
  
  // Your ORIGINAL DRIPPY token
  DRIPPY_TOKEN_ADDRESS: '0xAb09F142b1550253bAd5F8D4E28592Da0716c62A',
  
  // Axelar Testnet
  ITS_FACTORY_ADDRESS: '0x0E7620b73a53980f2138B43314fa944AE990d387', // InterchainTokenFactory
  
  // Destination chains
  XRPL_CHAIN_NAME: 'xrpl', // Axelar chain identifier for XRPL
};

// ABI
const ITS_FACTORY_ABI = [
  'function deployRemoteCanonicalInterchainToken(address originalTokenAddress, string calldata destinationChain, uint256 gasValue) external payable returns (bytes32 tokenId)',
  'function canonicalInterchainTokenId(address tokenAddress) external view returns (bytes32 tokenId)'
];

async function main() {
  console.log('\n🌍 DEPLOY REMOTE CANONICAL TOKEN\n');
  console.log('='.repeat(80));
  console.log('\nDeploying wrapped DRIPPY on XRPL Mainnet\n');

  // Connect to network
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to: ${network.name || 'XRPL EVM'} (Chain ID: ${network.chainId})\n`);
  } catch (error) {
    console.error('❌ Failed to connect to RPC\n');
    process.exit(1);
  }

  // Load deployer
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env\n');
    process.exit(1);
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} XRP\n`);

  // Check ITS Factory configured
  if (!CONFIG.ITS_FACTORY_ADDRESS || CONFIG.ITS_FACTORY_ADDRESS === '0x...') {
    console.log('❌ ERROR: ITS_FACTORY_ADDRESS not configured!\n');
    console.log('Update this in the script first.\n');
    process.exit(1);
  }

  const itsFactory = new ethers.Contract(
    CONFIG.ITS_FACTORY_ADDRESS,
    ITS_FACTORY_ABI,
    deployer
  );

  // Step 1: Verify token is registered
  console.log('='.repeat(80));
  console.log('\n🔍 STEP 1: Verifying Registration\n');

  let tokenId;
  try {
    tokenId = await itsFactory.canonicalInterchainTokenId(CONFIG.DRIPPY_TOKEN_ADDRESS);
    
    if (tokenId === ethers.ZeroHash) {
      console.error('❌ Token is NOT registered yet!\n');
      console.log('Run this first: node register-canonical-token.js\n');
      process.exit(1);
    }

    console.log(`✅ Token is registered`);
    console.log(`   Token ID: ${tokenId}\n`);
  } catch (error) {
    console.error('❌ Failed to check registration:', error.message);
    process.exit(1);
  }

  // Step 2: Deploy on XRPL
  console.log('='.repeat(80));
  console.log('\n🚀 STEP 2: Deploying to XRPL Mainnet\n');
  console.log('This will:\n');
  console.log('  ✓ Deploy wrapped DRIPPY token on XRPL');
  console.log('  ✓ Connect it to your canonical token on EVM');
  console.log('  ✓ Enable cross-chain bridging\n');
  console.log(`   Destination: ${CONFIG.XRPL_CHAIN_NAME}\n`);

  try {
    console.log('⏳ Submitting deployment transaction...\n');

    const gasValue = ethers.parseEther('6'); // Gas for Axelar cross-chain tx

    const tx = await itsFactory.deployRemoteCanonicalInterchainToken(
      CONFIG.DRIPPY_TOKEN_ADDRESS,
      CONFIG.XRPL_CHAIN_NAME,
      gasValue,
      {
        value: gasValue,
        gasLimit: 500000
      }
    );

    console.log(`   TX Hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log(`✅ Deployment initiated in block ${receipt.blockNumber}!\n`);

    console.log('⏳ Axelar relayers are now processing the cross-chain deployment...');
    console.log('   This can take 2-5 minutes.\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Ensure token is registered first');
    console.log('  2. Check you have enough XRP');
    console.log('  3. Verify XRPL_CHAIN_NAME is correct ("xrpl")\n');
    process.exit(1);
  }

  // Step 3: Summary
  console.log('='.repeat(80));
  console.log('\n🎉 DEPLOYMENT INITIATED!\n');
  console.log('='.repeat(80));

  console.log('\n📊 Status Check:\n');
  console.log('1. Monitor on Axelarscan:');
  console.log(`   https://testnet.axelarscan.io/\n`);

  console.log('2. Track by TX Hash:');
  console.log(`   Search for your transaction to see cross-chain status\n`);

  console.log('3. Once deployed, your wrapped DRIPPY will appear on XRPL');
  console.log('   as an IOU with your issuer address.\n');

  console.log('='.repeat(80));
  console.log('\n🌉 BRIDGE IS NOW READY!\n');
  console.log('Users can now bridge DRIPPY between:');
  console.log('  • XRPL EVM (original with all features)');
  console.log('  • XRPL Mainnet (wrapped version)\n');

  console.log('Next: Update your frontend and test the bridge!\n');
  console.log('='.repeat(80));

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

