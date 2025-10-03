# 🔐 Setup Deployer Private Key

## Add Your Private Key to .env

You need to add your deployer wallet's private key to run the registration script.

### Step 1: Export Private Key from MetaMask

1. Open MetaMask
2. Click the 3 dots menu → Account Details
3. Click "Export Private Key"
4. Enter your MetaMask password
5. **COPY** the private key (starts with `0x`)

### Step 2: Add to .env File

Open your `.env` file and add:

```bash
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
```

**Example**:
```bash
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Step 3: Verify Account Has XRP

Your deployer account needs:
- ✅ At least **10 XRP** for gas fees
- ✅ Be on **XRPL EVM Testnet** (Chain ID 1449000)

**Your deployer address**: `0x817c2Fed47Fb4f5a86bfCe9d8A10A59e7E981B40`

### ⚠️ Security Notes

- **NEVER** commit your `.env` file to Git
- **NEVER** share your private key with anyone
- The `.env` file is already in `.gitignore`
- After testing, consider using a hardware wallet

---

## 🌐 Network Issue Detected

The script connected to **Mainnet** (Chain ID 1440000) instead of **Testnet** (1449000).

### Quick Fix Option 1: Use Mainnet

If you want to deploy on MAINNET instead:

1. Make sure you have REAL XRP (costs ~$6 in gas)
2. Your token is already on Mainnet
3. Update addresses to Mainnet in the scripts

### Quick Fix Option 2: Switch to Testnet RPC

Try this RPC specifically for testnet:
```
https://rpc-evm-sidechain.xrpl.org
```

Or check https://docs.xrplevm.org for the latest testnet RPC.

---

## 🎯 Alternative: Use Axelar Portal (NO PRIVATE KEY NEEDED)

If you prefer NOT to expose your private key:

1. Go to: https://testnet.interchain.axelar.dev/
2. Connect MetaMask
3. Switch to XRPL EVM Testnet in MetaMask
4. Click "Register Existing Token"
5. Enter your DRIPPY address: `0xAb09F142b1550253bAd5F8D4E28592Da0716c62A`
6. Sign the transaction in MetaMask
7. Copy the `tokenId` you receive

**This does the EXACT SAME thing but through a UI!** 🎨

---

## What to Do Next

Choose one:

**Option A**: Add private key to `.env` and run the script
```bash
# After adding DEPLOYER_PRIVATE_KEY to .env
node register-canonical-token.js
```

**Option B**: Use Axelar Portal (recommended if concerned about security)
1. Go to portal
2. Connect wallet
3. Register token
4. Come back with tokenId

Either way works! 🚀

