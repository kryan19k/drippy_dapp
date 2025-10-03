/**
 * Get the tokenId for your Axelar ITS token
 */

const { ethers } = require('ethers');

async function getTokenId() {
  console.log('\n🔍 Getting Token ID for Axelar ITS Token\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc-evm-sidechain.xrpl.org');
  
  // Your new ITS token
  const tokenAddress = '0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A';
  
  const tokenABI = [
    'function interchainTokenId() external view returns (bytes32)'
  ];
  
  const token = new ethers.Contract(tokenAddress, tokenABI, provider);
  
  try {
    const tokenId = await token.interchainTokenId();
    
    console.log('✅ Token Address:', tokenAddress);
    console.log('✅ Token ID (bytes32):', tokenId);
    console.log('\n📝 Add this to frontend/.env:');
    console.log(`VITE_DRIPPY_TOKEN_ID=${tokenId}`);
    console.log('\n');
    
    return tokenId;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getTokenId();

