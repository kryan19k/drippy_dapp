# 🔗 DRIPPY Trustline Setup Guide

## What is a Trustline?

On XRPL, before you can receive an **IOU (Issued Currency)** like DRIPPY tokens, you need to establish a **trustline** with the issuer. Think of it as "opting in" to receive that specific token.

---

## 🎯 Quick Setup (Using the Bridge)

### **Option 1: One-Click Setup in Bridge Page** ⭐ **RECOMMENDED**

1. **Go to Bridge** (`/bridge`)
2. **Connect both wallets**:
   - ✅ MetaMask (EVM)
   - ✅ Xaman (XRPL)
3. **Select "EVM → XRPL" direction**
4. **If you don't have a trustline**, you'll see a yellow warning box:

   ```
   ⚠️ Trustline Required
   
   Your XRPL wallet needs a DRIPPY trustline to receive tokens.
   
   Issuer: rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
   Currency: DRIPPY
   
   [ Set Up DRIPPY Trustline in Xaman ]  ← Click this!
   ```

5. **Click "Set Up DRIPPY Trustline in Xaman"**
6. **Xaman app will open** on your phone
7. **Review and approve** the trustline transaction
8. **Done!** 🎉 Trustline is now active

**Cost**: ~0.00001 XRP (basically free)

---

## 🔧 Manual Setup Options

### **Option 2: Using Xaman Mobile App**

1. **Open Xaman app** on your phone
2. **Tap "Add Trustline"** (in the Assets section)
3. **Enter these details**:
   - **Issuer**: `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`
   - **Currency**: `DRIPPY`
   - **Limit** (optional): `1000000000` or leave default
4. **Approve** the transaction
5. **Done!** ✅

---

### **Option 3: Using XRPL.org Tools**

1. **Go to**: https://xrpl.org/tools.html
2. **Select "TrustSet Transaction"**
3. **Fill in**:
   ```json
   {
     "TransactionType": "TrustSet",
     "Account": "YOUR_XRPL_ADDRESS",
     "LimitAmount": {
       "currency": "DRIPPY",
       "issuer": "rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM",
       "value": "1000000000"
     }
   }
   ```
4. **Sign and submit**

---

### **Option 4: Dashboard Page (Coming Soon)**

The Dashboard also has a trustline setup button if you're connected with Xaman:

1. **Go to Dashboard** (`/dashboard`)
2. **Connect Xaman wallet**
3. **Look for "Set Up Trustline" button**
4. **Click and approve in Xaman**

---

## 📍 Configuration Details

### **XRPL Testnet** (For Testing)

| Parameter | Value |
|-----------|-------|
| **Issuer** | `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM` |
| **Currency** | `DRIPPY` |
| **Network** | XRPL Testnet |
| **Limit** | `1000000000` (or your preferred amount) |

### **XRPL Mainnet** (Production - When Ready)

| Parameter | Value |
|-----------|-------|
| **Issuer** | `rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ` |
| **Currency** | `DRIPPY` |
| **Network** | XRPL Mainnet |
| **Limit** | `1000000000` |

---

## 🔍 How to Check if Trustline is Active

### **Method 1: In the Bridge**

The bridge automatically detects if you have a trustline:
- ✅ **No warning** = Trustline is active
- ⚠️ **Yellow warning** = Trustline needed

### **Method 2: In Xaman App**

1. Open Xaman
2. Go to **Assets** tab
3. Look for **DRIPPY** in your token list
4. If you see it with `rnBpAWMDoD9...` as issuer → ✅ Active

### **Method 3: Using XRPL Explorer**

1. Go to: https://testnet.xrpl.org/accounts/YOUR_XRPL_ADDRESS
2. Check **Trust Lines** section
3. Look for:
   - Currency: `DRIPPY`
   - Issuer: `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`

---

## ⚠️ Important Notes

### **Reserve Requirement**

- Each trustline costs **2 XRP reserve** (locked, not spent)
- You can remove the trustline later to get the 2 XRP back
- Make sure you have at least **10 XRP** in your XRPL wallet before setting up trustlines

### **Security**

✅ **Safe to set up trustlines for:**
- Verified issuer addresses (like the ones above)
- Official DRIPPY issuer accounts

❌ **Never set up trustlines for:**
- Random addresses you don't recognize
- Addresses sent via DMs or spam
- Unverified "giveaway" tokens

### **Issuer Verification**

Always double-check the issuer address:
- **Testnet**: `rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM`
- **Mainnet**: `rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ`

A single character difference could be a scam!

---

## 🎬 Step-by-Step Video (Conceptual Flow)

```
1. Open Bridge Page
   ↓
2. Connect MetaMask + Xaman
   ↓
3. See Yellow Trustline Warning
   ↓
4. Click "Set Up DRIPPY Trustline"
   ↓
5. Xaman Opens on Phone
   ↓
6. Review Transaction Details
   ↓
7. Approve in Xaman
   ↓
8. ✅ Trustline Active!
   ↓
9. Bridge DRIPPY Tokens 🌉
```

---

## 🆘 Troubleshooting

### **"requestDrippyTrustline is not a function"**

**Solution**: Make sure you're using the latest version of the app. Clear cache and refresh.

### **Xaman doesn't open**

**Solution**:
1. Make sure Xaman app is installed on your phone
2. Try scanning the QR code manually
3. Check that your phone and computer are on the same network

### **"Insufficient XRP for reserve"**

**Solution**: Get more XRP in your wallet. You need at least 10 XRP for account reserve + trustline reserve.

### **Trustline shows as "not set" after approval**

**Solution**: 
1. Wait 5-10 seconds for the transaction to confirm
2. Refresh the page
3. The bridge will automatically detect it

---

## 🚀 Quick Reference

### **Bridge Page Trustline Setup**

```typescript
// When user doesn't have trustline:
bridge.hasDrippyTrustline === false

// Setup trustline:
const result = await bridge.requestDrippyTrustline()

// Check result:
if (result.signed) {
  // ✅ Success! Trustline is now active
  // Refresh balances to see it
  bridge.refetchBalances()
}
```

### **Environment Variables**

Your `.env` already has the correct issuer:

```bash
# XRPL DRIPPY Configuration (TESTNET)
VITE_DRIPPY_ISSUER=rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM
VITE_DRIPPY_CURRENCY=DRIPPY
VITE_DRIPPY_TRUSTLINE_LIMIT=1000000000
```

---

## 📚 Learn More

- **XRPL Trustlines**: https://xrpl.org/trust-lines-and-issuing.html
- **Xaman Support**: https://xumm.readme.io/
- **DRIPPY Bridge Docs**: See `BRIDGE_COMPLETE_CONFIG.md`

---

## ✅ Summary

**Setting up a DRIPPY trustline is now super easy!**

1. ✅ **One-click setup** on Bridge page
2. ✅ **Automatic detection** of trustline status
3. ✅ **Clear visual warnings** when needed
4. ✅ **Seamless Xaman integration**

**Cost**: ~0.00001 XRP + 2 XRP reserve  
**Time**: ~10 seconds  
**Difficulty**: Easy 🟢

Now you're ready to bridge DRIPPY tokens cross-chain! 🌉✨

