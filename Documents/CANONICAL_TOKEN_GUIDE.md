# Canonical Token Bridge - Complete Guide

## 🎯 What You're Building

You're registering your **ORIGINAL DRIPPY token** (`0xAb09F142b1550253bAd5F8D4E28592Da0716c62A`) as a **Canonical Interchain Token**.

### Why This Is Better

| Feature | New ITS Token (0x3c9D...) | Canonical Token (0xAb09...) |
|---------|--------------------------|---------------------------|
| Custom 5% Tax | ❌ No | ✅ **YES** - Preserved! |
| Anti-Snipe | ❌ No | ✅ **YES** - Preserved! |
| Fee Distribution | ❌ No | ✅ **YES** - All 4 pools! |
| Your Hard Work | ❌ Lost | ✅ **PRESERVED!** |
| Complexity | ✅ Simple | ⚠️ Moderate |

**Bottom line**: You keep ALL your custom features! 🎉

---

## 🏗️ How Canonical Tokens Work

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    XRPL EVM (Home Chain)                     │
│                                                              │
│  Your ORIGINAL DRIPPY Token                                 │
│  ├─ 5% Tax ✓                                                │
│  ├─ Anti-Snipe ✓                                            │
│  ├─ Fee Distribution ✓                                      │
│  └─ All Features Intact!                                    │
│                                                              │
│  Lock/Unlock Token Manager                                  │
│  ├─ Locks tokens when bridging OUT                          │
│  └─ Unlocks tokens when bridging IN                         │
│                                                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │  Axelar ITS
                 │
┌────────────────┴─────────────────────────────────────────────┐
│                    XRPL Mainnet (Remote Chain)               │
│                                                              │
│  Wrapped DRIPPY Token (IOU)                                 │
│  ├─ Simple ERC-20 wrapper                                   │
│  ├─ Minted when tokens locked on EVM                        │
│  └─ Burned when tokens unlocked on EVM                      │
│                                                              │
│  Issuer: Your XRPL Issuer Address                          │
│  Currency: DRIPPY                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Flow Examples

#### Bridging EVM → XRPL (Get wrapped DRIPPY)

1. User approves Token Manager to spend DRIPPY
2. User calls `ITS.interchainTransfer(tokenId, 'xrpl', recipient, amount)`
3. Token Manager **LOCKS** user's DRIPPY on EVM
4. Axelar validators observe and verify
5. Wrapped DRIPPY is **MINTED** on XRPL as IOU
6. User receives DRIPPY IOU on XRPL wallet

#### Bridging XRPL → EVM (Get original DRIPPY back)

1. User sends DRIPPY IOU to Axelar Gateway on XRPL
2. Axelar validators observe and verify
3. Wrapped DRIPPY is **BURNED** on XRPL
4. Token Manager **UNLOCKS** DRIPPY on EVM
5. User receives original DRIPPY on EVM wallet (with all features!)

---

## 📋 Implementation Steps

### Step 1: Find ITS Factory Address

**IMPORTANT**: You need the correct `InterchainTokenFactory` address for XRPL EVM Testnet.

#### Where to Find It:

1. **Check Axelar Docs**: https://docs.axelar.dev/resources/contract-addresses/testnet
   - Look for "InterchainTokenFactory" under XRPL EVM Testnet

2. **Ask Axelar Discord**: https://discord.gg/axelar
   - Channel: `#developers`
   - Ask: "What's the InterchainTokenFactory address for XRPL EVM Testnet (Chain ID 1449000)?"

3. **Check GitHub**: https://github.com/axelarnetwork/axelar-contract-deployments
   - Look in testnet deployments

4. **Alternative**: Use Axelarscan
   - https://testnet.axelarscan.io/
   - Search for deployed contracts on XRPL EVM

Once you have it, update **both** scripts:
- `register-canonical-token.js` (line 30)
- `deploy-remote-canonical.js` (line 21)

```javascript
ITS_FACTORY_ADDRESS: '0xYOUR_ACTUAL_ADDRESS_HERE'
```

### Step 2: Register Your Token

```bash
node register-canonical-token.js
```

This will:
- ✅ Deploy a Lock/Unlock Token Manager
- ✅ Link it to your DRIPPY token
- ✅ Return a `tokenId` (bytes32 hash)
- ⏱️ Takes ~30 seconds
- 💰 Costs ~6 XRP gas

**Save the `tokenId`!** You'll need it everywhere.

### Step 3: Deploy to XRPL

```bash
node deploy-remote-canonical.js
```

This will:
- ✅ Deploy wrapped DRIPPY on XRPL
- ✅ Connect it to your canonical token
- ⏱️ Takes 2-5 minutes (cross-chain)
- 💰 Costs ~6 XRP gas

### Step 4: Update Frontend

1. **Update `.env`**:
```bash
VITE_CANONICAL_DRIPPY_TOKEN_ID=0x... # From Step 2
VITE_DRIPPY_TOKEN_ADDRESS=0xAb09F142b1550253bAd5F8D4E28592Da0716c62A
```

2. **Update `contracts/latest.ts`**:
```typescript
export const DRIPPY_TOKEN_ADDRESS = '0xAb09F142b1550253bAd5F8D4E28592Da0716c62A' as `0x${string}`
```

3. **Update `useBridge.ts`** (line 12):
```typescript
const DRIPPY_TOKEN_ID_TESTNET = 'YOUR_TOKEN_ID_HERE' as `0x${string}`
```

### Step 5: Test the Bridge!

```bash
cd frontend && npm run dev
```

Go to `http://localhost:5173/bridge` and test with small amounts first!

---

## 🔧 Key Differences from ITS Token

### Approval Target

**ITS Token** (old approach):
```typescript
// Approve ITS contract
await drippyToken.approve(ITS_ADDRESS, amount)
```

**Canonical Token** (new approach):
```typescript
// Approve Token Manager (not ITS directly)
const tokenManagerAddress = await itsFactory.tokenManagerAddress(tokenId)
await drippyToken.approve(tokenManagerAddress, amount)
```

### Bridge Call

**ITS Token**:
```typescript
// Call on token itself
await drippyToken.interchainTransfer(
  destinationChain,
  recipient,
  amount,
  metadata,
  { value: gasFee }
)
```

**Canonical Token**:
```typescript
// Call on ITS contract with tokenId
await itsContract.interchainTransfer(
  tokenId,              // YOUR token's unique ID
  destinationChain,
  recipient,
  amount,
  metadata,
  { value: gasFee }
)
```

### Token Manager Functions

For canonical tokens, you also get access to:
- `setFlowLimit()` - Set max tokens that can bridge per time period
- `addFlowIn()` / `addFlowOut()` - Manage flow limits
- Role-based controls (minter, operator, etc.)

---

## 🔐 Security Considerations

### What's Secure

✅ **Your Original Token**: Never leaves XRPL EVM, just locked/unlocked  
✅ **Axelar Validators**: Decentralized network securing the bridge  
✅ **Lock/Unlock**: Can't create tokens out of thin air  
✅ **Flow Limits**: Can set max bridge amounts for safety

### What to Watch

⚠️ **Chain Security**: Remote chain security matters  
⚠️ **Flow Limits**: Set reasonable limits to prevent large drains  
⚠️ **Axelar Network**: Monitor Axelar network health

### Recommended Limits

For launch, consider:
- Flow limit: 10,000,000 DRIPPY per day
- Can adjust later based on usage

---

## 💰 Cost Breakdown

| Operation | Network | Cost | Frequency |
|-----------|---------|------|-----------|
| Register Token | EVM | ~6 XRP | One-time |
| Deploy Remote | EVM | ~6 XRP | One-time per chain |
| Bridge EVM→XRPL | EVM | ~6 XRP | Per bridge tx |
| Bridge XRPL→EVM | XRPL | ~0.00001 XRP | Per bridge tx |

**Total Setup Cost**: ~12 XRP (~$6-8)  
**Per Bridge**: ~6 XRP (~$3-4)

---

## 🐛 Troubleshooting

### "ITS_FACTORY_ADDRESS not configured"
→ Find the correct address (see Step 1 above)  
→ Update both scripts

### "Token is NOT registered"
→ Run `register-canonical-token.js` first  
→ Wait for confirmation before deploying remote

### "Insufficient allowance"
→ User needs to approve Token Manager  
→ Check `tokenManagerAddress` is correct

### "Remote deployment taking too long"
→ Check Axelarscan: https://testnet.axelarscan.io/  
→ Cross-chain can take 2-5 minutes  
→ If stuck >10 minutes, contact Axelar support

### "Bridge transaction failed"
→ Check user has enough DRIPPY  
→ Check Token Manager has approval  
→ Check flow limits not exceeded  
→ Ensure correct `tokenId` is used

---

## 📊 Monitoring

### Track Your Bridge

1. **Axelarscan**: https://testnet.axelarscan.io/
   - Search by transaction hash
   - See cross-chain status

2. **Your Admin Panel**: `/admin`
   - Monitor total bridged
   - Check Token Manager balance
   - View flow limits

3. **Set Up Alerts**:
   - Large bridge transactions
   - Flow limit approaching
   - Unusual activity

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Registration returns a valid `tokenId` (not zero hash)  
✅ Remote deployment completes on Axelarscan  
✅ Bridge UI shows both balances  
✅ Test bridge (100 DRIPPY) completes successfully  
✅ Wrapped DRIPPY appears on XRPL as IOU  
✅ Reverse bridge returns original DRIPPY on EVM

---

## 🚀 Next Steps After Launch

1. **Marketing**
   - Announce bridge launch
   - Tutorial videos
   - Bridge rewards campaign

2. **Add Features**
   - Bridge history dashboard
   - Transaction notifications
   - TVL (Total Value Locked) display

3. **Expand**
   - Deploy to more chains (Ethereum, BSC, etc.)
   - Each chain costs ~6 XRP to deploy
   - Same `tokenId` works everywhere!

4. **Optimize**
   - Set appropriate flow limits
   - Monitor and adjust gas fees
   - Implement bridge fee discounts

---

## 📞 Support

Need help?

1. **Axelar Discord**: https://discord.gg/axelar
   - Fast responses from Axelar team
   - Active developer community

2. **Axelar Docs**: https://docs.axelar.dev
   - Comprehensive documentation
   - Code examples

3. **GitHub Issues**: https://github.com/axelarnetwork/interchain-token-service/issues
   - Report bugs
   - Request features

---

## ✅ Checklist

Before you run the scripts:

- [ ] Found ITS Factory address for XRPL EVM Testnet
- [ ] Updated address in both scripts
- [ ] Have 20+ XRP in deployer wallet (for gas)
- [ ] `DEPLOYER_PRIVATE_KEY` in `.env` file
- [ ] Understand you're keeping your ORIGINAL token
- [ ] Ready to test with small amounts first

Let's go! 🚀

---

**Built with ❤️ following Axelar best practices**  
References:
- [Axelar ITS Docs](https://docs.axelar.dev/dev/send-tokens/interchain-tokens/)
- [Register Existing Token](https://docs.axelar.dev/dev/send-tokens/interchain-tokens/register-existing-token/)
- [ITS Contracts](https://github.com/axelarnetwork/interchain-token-service/tree/main/contracts)

