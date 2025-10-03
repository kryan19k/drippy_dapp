# 🔗 How to Connect Both EVM and XRPL Wallets

## Overview

Your Drippy app supports **dual wallet connections** - you can connect **MetaMask (EVM)** and **Xaman (XRPL)** at the same time!

---

## 🎯 Step-by-Step Connection

### **Step 1: Connect MetaMask (EVM Wallet)**

1. **Click the "Connect Wallet" button** in the navigation (top right)
2. **Select MetaMask** from the wallet options
3. **Approve the connection** in MetaMask popup
4. **Switch to XRPL EVM Testnet** (Chain ID: 1449000) if prompted
   - The app will auto-detect if you're on wrong network
   - Click "Switch Network" button or use the globe icon 🌐

**✅ MetaMask Connected!** You'll see:
- Your EVM address (0x...)
- Your XRP balance (native token)
- DRIPPY token balance

---

### **Step 2: Connect Xaman (XRPL Wallet)**

1. **Use the network switcher** (globe icon 🌐 in navigation)
2. **Select "XRPL Mainnet"** or **"XRPL Testnet"**
3. **Click "Connect Wallet"** again (different connect button for XRPL)
4. **Scan QR code** with Xaman mobile app or click the deeplink
5. **Approve the sign-in** in Xaman app

**✅ Xaman Connected!** You'll see:
- Your XRPL address (r...)
- Your XRP balance
- DRIPPY IOU balance (if you have trustline)

---

## 🌉 Using the Bridge

### **On the Bridge Page (`/bridge`):**

The Bridge page shows **connection status for BOTH wallets**:

```
┌─────────────────────────────────────┐
│  XRPL Wallet:  ✓ Connected          │
│  EVM Wallet:   ✓ Connected          │
└─────────────────────────────────────┘
```

**If either wallet is not connected**, the bridge will show:
- Which wallet needs to be connected
- A message prompting you to connect
- You can connect both from the bridge page!

---

## 🔄 How It Works Internally

### **Dual Context System**

The app uses **two separate wallet contexts** that work together:

#### **1. EVMContext** (MetaMask)
- Manages MetaMask connection
- Uses `wagmi` + `@reown/appkit`
- Tracks EVM chain ID, address, balance
- Handles network switching

#### **2. XRPLContext** (Xaman)
- Manages Xaman connection via OAuth2 PKCE
- Uses `xumm-oauth2-pkce` SDK
- Tracks XRPL address, XRP balance, DRIPPY IOU balance
- Handles transaction signing

### **Bridge Integration**

The `useBridge` hook combines both:
```typescript
const bridge = useBridge()

// Access both wallets:
bridge.evmAddress     // 0x817c2Fed...
bridge.xrplAccount    // rnBpAWMDoD9...
bridge.evmConnected   // true/false
bridge.xrplConnected  // true/false
```

---

## 🎨 User Experience

### **Navigation Shows Both**

In the top navigation, you'll see:
- **MetaMask button** (when on EVM network)
- **Xaman button** (when on XRPL network)
- **Network switcher** (globe icon) to toggle between them

### **Dashboard Shows Active Wallet**

- If you're on **EVM network**: Shows MetaMask info
- If you're on **XRPL network**: Shows Xaman info
- **Bridge page**: Shows BOTH simultaneously!

---

## 📍 Network Types

| Network | Type | Wallet | Chain ID |
|---------|------|--------|----------|
| **XRPL EVM Testnet** | EVM | MetaMask | 1449000 |
| **XRPL EVM Mainnet** | EVM | MetaMask | 1440000 |
| **XRPL Testnet** | XRPL Classic | Xaman | N/A (uses websocket) |
| **XRPL Mainnet** | XRPL Classic | Xaman | N/A (uses websocket) |

---

## 🚀 Quick Start

### **For Bridge Testing:**

1. **Connect MetaMask**
   - Switch to XRPL EVM Testnet (1449000)
   - Ensure you have DRIPPY tokens

2. **Connect Xaman**
   - Use XRPL Testnet or Mainnet
   - Set up DRIPPY trustline (see next section)

3. **Go to Bridge** (`/bridge`)
   - Both wallets will show as connected
   - You can now bridge DRIPPY cross-chain!

---

## 💡 Tips

✅ **You can stay connected to BOTH wallets** - they persist in browser storage  
✅ **Network switcher** automatically detects which wallet to use  
✅ **Bridge page** is the only page that requires BOTH wallets  
✅ **Other pages** (Swap, Staking, etc.) only need the relevant wallet for that network

---

## 🆘 Troubleshooting

### **"Wallet not connected" error on Bridge**

**Solution**: Make sure BOTH wallets are connected:
1. Check the bridge page connection status
2. Connect the missing wallet
3. Refresh the page if needed

### **Wrong network**

**Solution**:
1. Click globe icon (🌐) in navigation
2. Select correct network
3. Or use the "Switch Network" button when prompted

### **Xaman won't connect**

**Solution**:
1. Make sure Xaman mobile app is installed
2. Check that `VITE_XUMM_APP_KEY` is in `.env`
3. Try using the QR code instead of deeplink
4. Clear browser cache if connection is stuck

---

## 🎯 Summary

Your app is already set up for **dual wallet connections**!

✅ **MetaMask** for EVM (XRPL EVM Sidechain)  
✅ **Xaman** for XRPL (XRPL Mainnet/Testnet)  
✅ **Both work together** on the Bridge page  
✅ **Seamless switching** via Network Switcher  

No additional setup needed - just connect both wallets and start bridging! 🌉

