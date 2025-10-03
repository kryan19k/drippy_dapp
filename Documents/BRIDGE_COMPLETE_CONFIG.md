# 🌉 DRIPPY Bridge - Complete Configuration

## ✅ All Systems Configured and Ready!

---

## 📍 XRPL EVM Testnet (Chain ID: 1449000)

### ITS Token (Bridgeable ERC-20)

| Parameter | Address |
|-----------|---------|
| **Token Contract** | `0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A` |
| **Token Manager** | `0x84f790FDb139E6280c4d27E54D15ADD6f8A207Ef` |
| **Token ID** | `0x04c6a71be598c63881c4b450b036a4223b83cde33092fcab2428b8a43fe2f52f` |
| **Deployer** | `0x817c2Fed47Fb4f5a86bfCe9d8A10A59e7E981B40` |

### Axelar Contracts on XRPL EVM

| Contract | Address |
|----------|---------|
| **InterchainTokenService** | `0x3b1ca8B18698409fF95e29c506ad7014980F0193` |
| **InterchainTokenFactory** | `0x0E7620b73a53980f2138B43314fa944AE990d387` |
| **AxelarGateway** | `0x27a3daf3b243104E9b0afAabF56026a416B852C9` |
| **AxelarGasService** | `0x2CcdaDdc282D5F22F740398f1992003b525aE0F5` |

---

## 📍 XRPL Testnet

### DRIPPY IOU (Testnet)

| Parameter | Value |
|-----------|-------|
| **Issuer Address** | `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM` |
| **Currency Code** | `DRIPPY` |
| **Network** | XRPL Testnet |

### Axelar Gateway on XRPL

| Parameter | Value |
|-----------|-------|
| **Gateway Address** | `rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2` |
| **Chain ID (Axelar)** | `xrpl` |

---

## 📍 XRPL Mainnet (For Future Use)

### DRIPPY IOU (Mainnet)

| Parameter | Value |
|-----------|-------|
| **Issuer Address** | `rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ` |
| **Currency Code** | `DRIPPY` |
| **Network** | XRPL Mainnet |
| **Status** | 🔒 Not yet bridged (coming soon) |

---

## 🔄 Bridge Flow

### EVM → XRPL (Get XRPL IOU)

```
1. User approves Token Manager (0x84f7...)
2. User calls ITS.interchainTransfer()
   - TokenId: 0x04c6a71be598c63881c4b450b036a4223b83cde33092fcab2428b8a43fe2f52f
   - Destination: "xrpl"
   - Recipient: User's XRPL address (r...)
   - Amount: Amount in wei
3. Token Manager locks ERC-20 DRIPPY on EVM
4. Axelar validators observe and verify
5. Axelar Gateway (rNrjh1...) mints DRIPPY IOU on XRPL
   - Issuer: rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
6. User receives DRIPPY IOU in XRPL wallet
```

### XRPL → EVM (Get ERC-20 back)

```
1. User sends DRIPPY IOU to Axelar Gateway (rNrjh1...)
   - Include EVM address in memo
2. Axelar validators observe and verify
3. Gateway burns DRIPPY IOU on XRPL
4. Token Manager unlocks ERC-20 DRIPPY on EVM
5. User receives DRIPPY in MetaMask
```

---

## 🔐 Trustline Setup (Required for XRPL)

Before bridging EVM → XRPL, users need a trustline:

```javascript
{
  TransactionType: 'TrustSet',
  Account: 'YOUR_XRPL_ADDRESS',
  LimitAmount: {
    currency: 'DRIPPY',
    issuer: 'rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM',
    value: '1000000000'
  }
}
```

Or use Xaman mobile app:
1. Open Xaman
2. Add Trustline
3. Enter issuer: `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`
4. Currency: `DRIPPY`

---

## 💰 Bridge Costs

| Operation | Network | Cost |
|-----------|---------|------|
| **Approve Token Manager** | EVM | ~0.001 XRP |
| **Bridge EVM → XRPL** | EVM | ~6 XRP (Axelar gas) |
| **Bridge XRPL → EVM** | XRPL | ~0.00001 XRP + 6 XRP (memo gas) |
| **Set Trustline** | XRPL | ~0.00001 XRP |

---

## 🧪 Testing Checklist

### Before Testing:
- [ ] XRPL wallet connected (Xaman)
- [ ] EVM wallet connected (MetaMask on testnet 1449000)
- [ ] XRPL trustline set for issuer `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`
- [ ] Have testnet DRIPPY on EVM
- [ ] Have ~10 XRP for gas

### Test EVM → XRPL:
- [ ] Approve Token Manager
- [ ] Bridge 10 DRIPPY to XRPL
- [ ] Wait 1-2 minutes
- [ ] Verify DRIPPY IOU received on XRPL
- [ ] Check issuer matches `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`

### Test XRPL → EVM:
- [ ] Bridge 10 DRIPPY back to EVM
- [ ] Sign with Xaman
- [ ] Wait 1-2 minutes
- [ ] Verify DRIPPY ERC-20 received in MetaMask
- [ ] Check contract matches `0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A`

---

## 🔍 Verification Links

### XRPL EVM Testnet Explorer:
- **ITS Token**: https://explorer.testnet.xrplevm.org/address/0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A
- **Token Manager**: https://explorer.testnet.xrplevm.org/address/0x84f790FDb139E6280c4d27E54D15ADD6f8A207Ef
- **Your Deployer**: https://explorer.testnet.xrplevm.org/address/0x817c2Fed47Fb4f5a86bfCe9d8A10A59e7E981B40

### XRPL Testnet Explorer:
- **Your Issuer**: https://testnet.xrpl.org/accounts/rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
- **Axelar Gateway**: https://testnet.xrpl.org/accounts/rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2

### Axelar Testnet:
- **Track Transactions**: https://testnet.axelarscan.io/

---

## 🎯 Environment Variables Summary

### Frontend `.env`:
```bash
# XRPL Configuration (TESTNET)
VITE_DRIPPY_ISSUER=rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
VITE_DRIPPY_CURRENCY=DRIPPY
VITE_DRIPPY_TRUSTLINE_LIMIT=1000000000

# ITS Token Configuration
VITE_DRIPPY_TOKEN_ADDRESS=0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A
VITE_DRIPPY_TOKEN_ID=0x04c6a71be598c63881c4b450b036a4223b83cde33092fcab2428b8a43fe2f52f
VITE_DRIPPY_TOKEN_MANAGER=0x84f790FDb139E6280c4d27E54D15ADD6f8A207Ef
```

### Root `.env` (for scripts):
```bash
# Deployer
DEPLOYER_PRIVATE_KEY=your_private_key_here

# XRPL DRIPPY (TESTNET)
DRIPPY_ISSUER=rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
DRIPPY_CURRENCY=DRIPPY

# XRPL DRIPPY (MAINNET) - Future
DRIPPY_ISSUER_MAINNET=rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ
```

---

## 🚀 Launch Commands

```bash
# Start frontend
cd frontend
npm run dev

# Navigate to bridge
open http://localhost:5173/bridge
```

---

## 📞 Support Resources

- **Axelar Discord**: https://discord.gg/axelar
- **XRPL Discord**: https://discord.gg/xrpl
- **Axelar Docs**: https://docs.axelar.dev
- **XRPL EVM Docs**: https://docs.xrplevm.org

---

## ✅ Status: READY FOR TESTING

All configurations are in place. You can now:
1. ✅ Bridge DRIPPY from EVM to XRPL Testnet
2. ✅ Bridge DRIPPY from XRPL Testnet to EVM
3. ✅ Test with small amounts (10-100 DRIPPY)
4. ✅ Deploy to mainnet when ready

---

**Last Updated**: Configuration complete with Testnet issuer  
**Bridge Status**: 🟢 **OPERATIONAL**

Start testing! 🎉

