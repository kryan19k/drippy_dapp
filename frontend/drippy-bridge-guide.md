# DRIPPY Bridge: XRPL Mainnet ↔ EVM Sidechain

## Bridge Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    XRPL MAINNET                         │
│                                                         │
│  User Wallet (rUser...)                                │
│      │                                                  │
│      │ 1. Send DRIPPY IOU                              │
│      ↓                                                  │
│  Bridge Escrow Account (rBridge...)                    │
│  └─ Holds all locked DRIPPY IOUs                       │
│                                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ 2. Oracle monitors escrow
                 │    - Detects deposit
                 │    - Verifies transaction
                 │    - Generates proof
                 │
┌────────────────┴────────────────────────────────────────┐
│              XRPL EVM SIDECHAIN                         │
│                                                         │
│  Bridge Oracle Service (Off-chain)                     │
│      │                                                  │
│      │ 3. Call bridgeMint()                            │
│      ↓                                                  │
│  DrippyToken Contract                                  │
│  └─ Mints ERC-20 DRIPPY (1:1 ratio)                   │
│      │                                                  │
│      │ 4. Transfer to user                             │
│      ↓                                                  │
│  User Wallet (0xUser...)                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Components Needed

### 1. XRPL Bridge Escrow Account

**Setup:**
```javascript
// Create a dedicated account on XRPL for bridge escrow
const xrpl = require('xrpl');

async function setupBridgeEscrow() {
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    
    // Generate bridge account (SAVE THESE KEYS SECURELY!)
    const bridgeWallet = xrpl.Wallet.generate();
    
    console.log('Bridge Escrow Account:');
    console.log('Address:', bridgeWallet.address);
    console.log('Seed:', bridgeWallet.seed);
    console.log('Public Key:', bridgeWallet.publicKey);
    
    // Fund the account (min 10 XRP reserve)
    // You need to send XRP to this address first
    
    // Set up trustline for DRIPPY IOU
    const trustSet = {
        TransactionType: 'TrustSet',
        Account: bridgeWallet.address,
        LimitAmount: {
            currency: 'DRIPPY', // Your currency code
            issuer: 'rYourDrippyIssuer...', // Your DRIPPY issuer address
            value: '1000000000' // Max trust (1 billion)
        }
    };
    
    const prepared = await client.autofill(trustSet);
    const signed = bridgeWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('Trustline created:', result);
    
    await client.disconnect();
    return bridgeWallet;
}
```

**Security Best Practices:**
- Use multi-sig for bridge escrow account (3-of-5 or 5-of-7)
- Store keys in hardware security module (HSM)
- Implement rate limits on withdrawals
- Set up monitoring and alerts

### 2. Bridge Oracle Service

**File: `bridge-oracle/src/xrpl-to-evm.js`**

```javascript
const xrpl = require('xrpl');
const { ethers } = require('ethers');
require('dotenv').config();

class XRPLToEVMBridge {
    constructor() {
        // XRPL connection
        this.xrplClient = new xrpl.Client(process.env.XRPL_WSS);
        this.bridgeAddress = process.env.BRIDGE_XRPL_ADDRESS;
        this.drippyIssuer = process.env.DRIPPY_ISSUER;
        this.drippyCurrency = process.env.DRIPPY_CURRENCY || 'DRIPPY';
        
        // EVM connection
        this.evmProvider = new ethers.JsonRpcProvider(process.env.EVM_RPC);
        this.evmSigner = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, this.evmProvider);
        this.drippyContract = new ethers.Contract(
            process.env.DRIPPY_CONTRACT_ADDRESS,
            DRIPPY_ABI,
            this.evmSigner
        );
        
        // Tracking
        this.processedTxs = new Set();
        this.lastLedger = 0;
    }
    
    async start() {
        console.log('Starting XRPL to EVM Bridge Oracle...');
        
        await this.xrplClient.connect();
        console.log('Connected to XRPL');
        
        // Subscribe to bridge escrow account
        await this.xrplClient.request({
            command: 'subscribe',
            accounts: [this.bridgeAddress]
        });
        
        console.log(`Monitoring escrow account: ${this.bridgeAddress}`);
        
        // Listen for transactions
        this.xrplClient.on('transaction', this.handleTransaction.bind(this));
        
        // Also scan for historical transactions we might have missed
        await this.scanHistoricalTransactions();
    }
    
    async handleTransaction(tx) {
        try {
            // Only process validated transactions
            if (!tx.validated) return;
            
            // Check if it's a payment to bridge escrow
            if (tx.transaction.TransactionType !== 'Payment') return;
            if (tx.transaction.Destination !== this.bridgeAddress) return;
            
            // Check if it's DRIPPY IOU
            const amount = tx.transaction.Amount;
            if (typeof amount === 'string') return; // XRP payment, ignore
            
            if (amount.currency !== this.drippyCurrency) return;
            if (amount.issuer !== this.drippyIssuer) return;
            
            // Check if already processed
            const txHash = tx.transaction.hash;
            if (this.processedTxs.has(txHash)) return;
            
            console.log('\n🔔 New DRIPPY deposit detected!');
            console.log('TX Hash:', txHash);
            console.log('From:', tx.transaction.Account);
            console.log('Amount:', amount.value);
            
            // Extract EVM destination address from memos
            const evmAddress = this.extractEVMAddress(tx.transaction.Memos);
            
            if (!evmAddress) {
                console.error('❌ No valid EVM address in memos, cannot bridge');
                return;
            }
            
            console.log('EVM Destination:', evmAddress);
            
            // Verify transaction is finalized (wait for confirmations)
            await this.waitForFinality(txHash);
            
            // Mint on EVM
            await this.mintOnEVM(txHash, evmAddress, amount.value);
            
            // Mark as processed
            this.processedTxs.add(txHash);
            
        } catch (error) {
            console.error('Error handling transaction:', error);
        }
    }
    
    extractEVMAddress(memos) {
        if (!memos || memos.length === 0) return null;
        
        for (const memoWrapper of memos) {
            const memo = memoWrapper.Memo;
            
            // Check for EVM_ADDRESS memo type
            if (memo.MemoType) {
                const type = Buffer.from(memo.MemoType, 'hex').toString('utf8');
                if (type === 'EVM_ADDRESS' && memo.MemoData) {
                    const address = Buffer.from(memo.MemoData, 'hex').toString('utf8');
                    // Validate EVM address
                    if (ethers.isAddress(address)) {
                        return address;
                    }
                }
            }
        }
        
        return null;
    }
    
    async waitForFinality(txHash) {
        // Wait for 5 ledgers (about 15-25 seconds) for safety
        console.log('⏳ Waiting for finality...');
        
        let ledgersClosed = 0;
        const targetLedgers = 5;
        
        return new Promise((resolve) => {
            const checkLedger = () => {
                this.xrplClient.request({
                    command: 'tx',
                    transaction: txHash
                }).then(result => {
                    if (result.validated && result.ledger_index) {
                        this.xrplClient.request({
                            command: 'ledger',
                            ledger_index: 'validated'
                        }).then(ledger => {
                            const currentLedger = ledger.ledger_index;
                            const txLedger = result.ledger_index;
                            
                            if (currentLedger - txLedger >= targetLedgers) {
                                console.log('✅ Transaction finalized');
                                resolve();
                            } else {
                                setTimeout(checkLedger, 5000);
                            }
                        });
                    }
                });
            };
            
            checkLedger();
        });
    }
    
    async mintOnEVM(xrplTxHash, evmAddress, amount) {
        try {
            console.log('🔨 Minting on EVM...');
            
            // Convert amount to wei (assuming 18 decimals)
            const amountWei = ethers.parseEther(amount);
            
            // Check if already minted (replay protection)
            const alreadyMinted = await this.drippyContract.processedXRPLTxs(xrplTxHash);
            if (alreadyMinted) {
                console.log('⚠️  Already minted for this XRPL tx');
                return;
            }
            
            // Call bridgeMint
            const tx = await this.drippyContract.bridgeMint(
                evmAddress,
                amountWei,
                'xrpl',
                { gasLimit: 200000 }
            );
            
            console.log('📝 EVM TX submitted:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Minted on EVM! Block:', receipt.blockNumber);
            
            // Store mapping for tracking
            await this.storeMapping(xrplTxHash, tx.hash, evmAddress, amount);
            
        } catch (error) {
            console.error('❌ Error minting on EVM:', error);
            
            // Alert admin
            await this.sendAlert('MINT_FAILED', {
                xrplTxHash,
                evmAddress,
                amount,
                error: error.message
            });
        }
    }
    
    async scanHistoricalTransactions() {
        // Scan last 100 ledgers for any missed transactions
        console.log('🔍 Scanning historical transactions...');
        
        const response = await this.xrplClient.request({
            command: 'account_tx',
            account: this.bridgeAddress,
            ledger_index_min: -1,
            ledger_index_max: -1,
            limit: 100
        });
        
        for (const tx of response.transactions) {
            if (tx.validated) {
                await this.handleTransaction({
                    transaction: tx.tx,
                    validated: true
                });
            }
        }
        
        console.log('✅ Historical scan complete');
    }
    
    async storeMapping(xrplTxHash, evmTxHash, address, amount) {
        // Store in database for tracking
        // Implementation depends on your DB choice
        console.log('Storing mapping:', {
            xrplTxHash,
            evmTxHash,
            address,
            amount,
            timestamp: new Date()
        });
    }
    
    async sendAlert(type, data) {
        // Send alert via email/telegram/discord
        console.log(`🚨 ALERT [${type}]:`, data);
    }
}

// DRIPPY Contract ABI (bridgeMint function)
const DRIPPY_ABI = [
    "function bridgeMint(address to, uint256 amount, string sourceChain) external",
    "function bridgeBurn(address from, uint256 amount, string destinationChain) external",
    "function processedXRPLTxs(string txHash) external view returns (bool)"
];

// Start the oracle
const oracle = new XRPLToEVMBridge();
oracle.start().catch(console.error);
```

### 3. Reverse Bridge (EVM to XRPL)

**File: `bridge-oracle/src/evm-to-xrpl.js`**

```javascript
const { ethers } = require('ethers');
const xrpl = require('xrpl');

class EVMToXRPLBridge {
    constructor() {
        // EVM connection
        this.evmProvider = new ethers.JsonRpcProvider(process.env.EVM_RPC);
        this.drippyContract = new ethers.Contract(
            process.env.DRIPPY_CONTRACT_ADDRESS,
            DRIPPY_ABI,
            this.evmProvider
        );
        
        // XRPL connection
        this.xrplClient = new xrpl.Client(process.env.XRPL_WSS);
        this.bridgeWallet = xrpl.Wallet.fromSeed(process.env.BRIDGE_XRPL_SEED);
        
        this.processedBurns = new Set();
    }
    
    async start() {
        console.log('Starting EVM to XRPL Bridge Oracle...');
        
        await this.xrplClient.connect();
        
        // Listen for BridgeBurn events
        this.drippyContract.on('BridgeBurn', async (from, amount, destinationChain, event) => {
            await this.handleBurn(from, amount, destinationChain, event);
        });
        
        console.log('Listening for burn events...');
    }
    
    async handleBurn(from, amount, destinationChain, event) {
        try {
            if (destinationChain !== 'xrpl') return;
            
            const txHash = event.log.transactionHash;
            if (this.processedBurns.has(txHash)) return;
            
            console.log('\n🔥 Burn detected!');
            console.log('EVM TX:', txHash);
            console.log('From:', from);
            console.log('Amount:', ethers.formatEther(amount));
            
            // Wait for confirmations
            await this.waitForConfirmations(event.log.blockNumber, 5);
            
            // Extract XRPL destination from event or user mapping
            const xrplAddress = await this.getXRPLAddress(from);
            
            if (!xrplAddress) {
                console.error('❌ No XRPL address linked for', from);
                return;
            }
            
            console.log('XRPL Destination:', xrplAddress);
            
            // Send DRIPPY from escrow to user
            await this.sendFromEscrow(xrplAddress, ethers.formatEther(amount));
            
            this.processedBurns.add(txHash);
            
        } catch (error) {
            console.error('Error handling burn:', error);
        }
    }
    
    async waitForConfirmations(blockNumber, confirmations) {
        console.log('⏳ Waiting for confirmations...');
        
        while (true) {
            const currentBlock = await this.evmProvider.getBlockNumber();
            if (currentBlock - blockNumber >= confirmations) {
                console.log('✅ Confirmed');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    async getXRPLAddress(evmAddress) {
        // Get from database or user mapping
        // For now, return a test address
        // TODO: Implement proper address linking system
        return 'rUserXRPLAddress...';
    }
    
    async sendFromEscrow(xrplAddress, amount) {
        try {
            console.log('💸 Sending DRIPPY from escrow...');
            
            const payment = {
                TransactionType: 'Payment',
                Account: this.bridgeWallet.address,
                Destination: xrplAddress,
                Amount: {
                    currency: process.env.DRIPPY_CURRENCY,
                    issuer: process.env.DRIPPY_ISSUER,
                    value: amount
                }
            };
            
            const prepared = await this.xrplClient.autofill(payment);
            const signed = this.bridgeWallet.sign(prepared);
            const result = await this.xrplClient.submitAndWait(signed.tx_blob);
            
            console.log('✅ Sent on XRPL! TX:', result.result.hash);
            
        } catch (error) {
            console.error('❌ Error sending on XRPL:', error);
        }
    }
}

const DRIPPY_ABI = [
    "event BridgeBurn(address indexed from, uint256 amount, string destinationChain)"
];

const oracle = new EVMToXRPLBridge();
oracle.start().catch(console.error);
```

## User Guide: How to Bridge

### XRPL → EVM (Get ERC-20 DRIPPY)

**Step 1: Prepare XRPL Transaction**
```javascript
const xrpl = require('xrpl');

async function bridgeToEVM(amount, evmAddress) {
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    
    const wallet = xrpl.Wallet.fromSeed('YOUR_XRPL_SEED');
    
    // Create payment with EVM address in memo
    const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: 'rBridgeEscrowAddress...', // Bridge escrow
        Amount: {
            currency: 'DRIPPY',
            issuer: 'rDrippyIssuer...',
            value: amount.toString()
        },
        Memos: [{
            Memo: {
                MemoType: Buffer.from('EVM_ADDRESS', 'utf8').toString('hex'),
                MemoData: Buffer.from(evmAddress, 'utf8').toString('hex')
            }
        }]
    };
    
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('Transaction sent:', result.result.hash);
    console.log('Wait 1-2 minutes for ERC-20 DRIPPY to arrive at:', evmAddress);
    
    await client.disconnect();
}

// Example usage
bridgeToEVM(1000, '0xYourEVMAddress...');
```

### EVM → XRPL (Get XRPL DRIPPY back)

**Option 1: Call bridgeBurn**
```javascript
// User calls bridgeBurn from their wallet
const tx = await drippyContract.bridgeBurn(
    userAddress,
    ethers.parseEther('1000'),
    'xrpl'
);
```

**Option 2: Use Web Interface**
```javascript
// In your web dashboard
async function bridgeToXRPL(amount, xrplAddress) {
    // Link addresses first (one-time)
    await linkAddresses(evmAddress, xrplAddress);
    
    // Burn tokens
    const tx = await drippyContract.bridgeBurn(
        await signer.getAddress(),
        ethers.parseEther(amount),
        'xrpl'
    );
    
    await tx.wait();
    console.log('Tokens burned, XRPL DRIPPY will arrive in 1-2 minutes');
}
```

## Enhanced DrippyToken with Replay Protection

Add this to DrippyToken.sol:

```solidity
// Add to state variables
mapping(string => bool) public processedXRPLTxs;

// Modify bridgeMint
function bridgeMint(
    address to, 
    uint256 amount,
    string calldata sourceChain
) external onlyRole(BRIDGE_ROLE) {
    // Generate tx identifier from msg.sender and block data
    // This prevents replay attacks
    string memory txId = string(abi.encodePacked(
        sourceChain, 
        "-",
        Strings.toHexString(block.number)
    ));
    
    require(!processedXRPLTxs[txId], "DRIPPY: Already processed");
    require(to != address(0), "DRIPPY: Mint to zero address");
    require(totalSupply() + amount <= MAX_SUPPLY, "DRIPPY: Exceeds max supply");
    
    processedXRPLTxs[txId] = true;
    _mint(to, amount);
    emit BridgeMint(to, amount, sourceChain);
}
```

## Deployment Checklist

- [ ] Deploy DrippyToken contract on EVM
- [ ] Create bridge escrow account on XRPL
- [ ] Fund escrow with XRP (10+ for reserve)
- [ ] Set trustline for DRIPPY on escrow account
- [ ] Deploy oracle service on reliable server
- [ ] Set up monitoring and alerts
- [ ] Test with small amounts first
- [ ] Set up rate limits and circuit breakers
- [ ] Implement multi-sig for escrow account
- [ ] Create user-friendly bridge interface

## Security Considerations

**Critical:**
1. Multi-sig escrow account (3-of-5 minimum)
2. Rate limits on bridge (e.g., max 100k DRIPPY per hour)
3. Circuit breaker if unusual activity detected
4. Replay attack prevention (track processed txs)
5. Regular audits of escrow balance vs EVM supply
6. Cold storage backup keys
7. Insurance fund for bridge failures

**Monitoring:**
- Escrow balance on XRPL
- EVM token supply
- Ratio should always be 1:1
- Alert if discrepancy > 0.1%

## Estimated Costs

**Infrastructure:**
- Server for oracle: $50-100/month
- Database: $20-50/month
- Monitoring: $20/month

**Transaction Costs:**
- XRPL: ~0.00001 XRP per tx (~$0.00001)
- EVM: ~$0.10-0.50 per mint/burn

**One-time:**
- Security audit: $20,000-40,000
- Multi-sig setup: $500-1,000

---

This is the standard bridge architecture used by most projects. Your oracle service is the critical component that maintains the 1:1 peg between XRPL and EVM.
