/**
 * DRIPPY Bridge Setup Script
 * 
 * This script helps you register DRIPPY with Axelar ITS and configure the bridge.
 * Run this ONCE to set up the bridge infrastructure.
 * 
 * Prerequisites:
 * 1. DRIPPY token deployed on XRPL EVM
 * 2. You have deployer private key
 * 3. You have some XRP for gas
 * 
 * Usage:
 *   node setup-bridge.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CONFIG = {
  // XRPL EVM Testnet
  RPC_URL: 'https://rpc-evm-sidechain.xrpl.org',
  CHAIN_ID: 1449000,
  
  // Your deployed DRIPPY contract
  DRIPPY_CONTRACT: '0xAb09F142b1550253bAd5F8D4E28592Da0716c62A',
  
  // Axelar Testnet addresses
  ITS_CONTRACT: '0x3b1ca8B18698409fF95e29c506ad7014980F0193',
  GATEWAY_CONTRACT: '0x...' // Get from https://docs.axelar.dev/resources/contract-addresses/testnet
};

// ABIs (simplified)
const DRIPPY_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function configureAxelar(address _gateway, address _its, bytes32 _tokenId) external',
  'function hasRole(bytes32 role, address account) external view returns (bool)'
];

const ITS_ABI = [
  'function interchainTokenId(address deployer, bytes32 salt) external view returns (bytes32)',
  'function deployInterchainToken(bytes32 salt, string name, string symbol, uint8 decimals, uint256 initialSupply, address minter) external payable returns (bytes32)'
];

async function main() {
  console.log('\n🌉 DRIPPY Bridge Setup\n');
  console.log('='.repeat(60));

  // Connect to network
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const network = await provider.getNetwork();
  console.log(`\n✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);

  // Load deployer wallet
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} XRP\n`);

  if (balance < ethers.parseEther('10')) {
    console.warn('⚠️  Warning: Balance is low. You need at least 10 XRP for gas fees.\n');
  }

  // Load contracts
  const drippyContract = new ethers.Contract(CONFIG.DRIPPY_CONTRACT, DRIPPY_ABI, deployer);
  const itsContract = new ethers.Contract(CONFIG.ITS_CONTRACT, ITS_ABI, deployer);

  console.log('📋 Contract Configuration:');
  console.log(`   DRIPPY Token: ${CONFIG.DRIPPY_CONTRACT}`);
  console.log(`   Axelar ITS:   ${CONFIG.ITS_CONTRACT}\n`);

  // Step 1: Register with Axelar ITS
  console.log('='.repeat(60));
  console.log('\n📝 STEP 1: Register DRIPPY with Axelar ITS\n');

  const salt = ethers.id('DRIPPY'); // Unique salt for your token
  let tokenId;

  try {
    // Check if already registered
    tokenId = await itsContract.interchainTokenId(deployer.address, salt);
    console.log(`✅ DRIPPY already registered!`);
    console.log(`   Token ID: ${tokenId}\n`);
  } catch (error) {
    console.log('⏳ Registering DRIPPY with Axelar ITS...\n');
    
    try {
      const tx = await itsContract.deployInterchainToken(
        salt,
        'DRIPPY',
        'DRIP',
        18,
        0, // No initial supply (already minted in DRIPPY contract)
        CONFIG.DRIPPY_CONTRACT, // Original token
        { 
          gasLimit: 500000,
          value: ethers.parseEther('6') // Gas for Axelar
        }
      );

      console.log(`   TX Hash: ${tx.hash}`);
      console.log('   Waiting for confirmation...\n');
      
      const receipt = await tx.wait();
      console.log(`✅ Registration confirmed in block ${receipt.blockNumber}\n`);

      // Get token ID
      tokenId = await itsContract.interchainTokenId(deployer.address, salt);
      console.log(`🎉 Token ID: ${tokenId}\n`);
    } catch (err) {
      console.error('❌ Registration failed:', err.message);
      process.exit(1);
    }
  }

  // Step 2: Grant BRIDGE_ROLE to ITS contract
  console.log('='.repeat(60));
  console.log('\n🔐 STEP 2: Grant BRIDGE_ROLE to ITS Contract\n');

  const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes('BRIDGE_ROLE'));
  
  try {
    const hasRole = await drippyContract.hasRole(BRIDGE_ROLE, CONFIG.ITS_CONTRACT);
    
    if (hasRole) {
      console.log('✅ ITS contract already has BRIDGE_ROLE\n');
    } else {
      console.log('⏳ Granting BRIDGE_ROLE to ITS contract...\n');
      
      const tx = await drippyContract.grantRole(BRIDGE_ROLE, CONFIG.ITS_CONTRACT, {
        gasLimit: 100000
      });

      console.log(`   TX Hash: ${tx.hash}`);
      console.log('   Waiting for confirmation...\n');
      
      await tx.wait();
      console.log('✅ BRIDGE_ROLE granted successfully!\n');
    }
  } catch (err) {
    console.error('❌ Failed to grant role:', err.message);
    process.exit(1);
  }

  // Step 3: Configure Axelar in DRIPPY contract
  console.log('='.repeat(60));
  console.log('\n⚙️  STEP 3: Configure Axelar in DRIPPY Contract\n');

  try {
    console.log('⏳ Calling configureAxelar()...\n');
    
    const tx = await drippyContract.configureAxelar(
      CONFIG.GATEWAY_CONTRACT,
      CONFIG.ITS_CONTRACT,
      tokenId,
      { gasLimit: 100000 }
    );

    console.log(`   TX Hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...\n');
    
    await tx.wait();
    console.log('✅ Axelar configuration complete!\n');
  } catch (err) {
    console.error('❌ Configuration failed:', err.message);
    console.log('\nℹ️  Note: If you get "execution reverted", the contract may already be configured.\n');
  }

  // Step 4: Display summary
  console.log('='.repeat(60));
  console.log('\n🎉 BRIDGE SETUP COMPLETE!\n');
  console.log('='.repeat(60));
  console.log('\n📋 Configuration Summary:\n');
  console.log(`   ✅ DRIPPY registered with Axelar ITS`);
  console.log(`   ✅ Token ID: ${tokenId}`);
  console.log(`   ✅ BRIDGE_ROLE granted to ITS`);
  console.log(`   ✅ Axelar configured in contract`);

  console.log('\n📝 Next Steps:\n');
  console.log('   1. Add to frontend/.env:');
  console.log(`      VITE_DRIPPY_TOKEN_ID=${tokenId}`);
  console.log(`      VITE_AXELAR_ITS_EVM=${CONFIG.ITS_CONTRACT}`);
  console.log(`      VITE_DRIPPY_ISSUER=rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ`);
  console.log(`      VITE_DRIPPY_CURRENCY=DRIPPY`);
  console.log('\n   2. Update useBridge.ts:');
  console.log(`      - Line 12: DRIPPY_TOKEN_ID_TESTNET = '${tokenId}'`);
  console.log('\n   3. Test the bridge with small amounts first!');
  console.log('\n   4. Go to /bridge in your dApp and try it out! 🚀\n');

  console.log('='.repeat(60));
  console.log('\n✨ Bridge is ready to use! ✨\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

