# 🚀 Quick Start: Admin Dashboard

## 🎯 Access the Admin Panel

### 1. **Navigate to Admin**
```
http://localhost:5173/admin
```

### 2. **Requirements**
- ✅ Connected to XRPL EVM Testnet (Chain ID: 1449000)
- ✅ MetaMask wallet connected
- ✅ Your address has one of these roles:
  - `DEFAULT_ADMIN_ROLE` (Owner - full access)
  - `OPERATOR_ROLE` (Operational controls)
  - `FEE_MANAGER_ROLE` (Fee configuration)

---

## 📋 Quick Actions

### **Launch Token** (First Time Only)
```
1. Navigate to /admin
2. Click "Overview" tab
3. Click "🚀 Launch Token"
4. Confirm in MetaMask
5. Anti-snipe will activate for 20 blocks
```

### **Whitelist Early Buyers**
```
1. Click "Access Control" tab
2. Enter addresses (comma-separated):
   0x123..., 0x456..., 0x789...
3. Click "Add to Whitelist"
4. These addresses bypass anti-snipe tax
```

### **Update Tax Rates**
```
1. Click "Token Config" tab
2. Set Normal Tax: 5%
3. Set Anti-Snipe Tax: 50%
4. Click "Update Tax Rates"
```

### **Configure Fee Distribution**
```
1. Click "Fee Management" tab
2. Adjust percentages (must total 100%):
   - NFT Pool: 20%
   - Token Pool: 40%
   - Treasury: 20%
   - AMM: 20%
3. Click "Update Fee Distribution"
```

### **Emergency Pause**
```
1. Click "Emergency" tab
2. Click "Pause Token" (stops all transfers)
3. To resume: Click "Unpause Token"
```

---

## 🎨 Dashboard Overview

### **Status Bar** (Always Visible)
Shows 4 key metrics:
- 🟢 Token Status (Active/Paused)
- ⚡ Anti-Snipe Status
- 💰 Current Tax Rate
- 🔄 Distribution Count

### **5 Tabs:**

#### **1. Overview 📈**
- Token & router statistics
- Quick action buttons
- Distribution history

#### **2. Token Config ⚙️**
- Tax rates
- Transaction limits
- AMM pair management

#### **3. Fee Management 💰**
- Pool allocations
- Min distribution amount
- Force distribute button

#### **4. Access Control 👥**
- Whitelist/Blacklist
- Role management (Admin only)

#### **5. Emergency ⚠️**
- Pause/Unpause contracts
- Danger zone warnings

---

## 👥 Role Permissions

### **Owner (DEFAULT_ADMIN_ROLE)**
Full access to everything:
- ✅ All 5 tabs visible
- ✅ Launch token
- ✅ Emergency controls
- ✅ Role management
- ✅ Remove limits (permanent)

### **Operator (OPERATOR_ROLE)**
Day-to-day operations:
- ✅ Whitelist/Blacklist
- ✅ AMM pairs
- ✅ Distribute fees
- ❌ Cannot change tax rates
- ❌ Cannot pause contracts

### **Fee Manager (FEE_MANAGER_ROLE)**
Fee configuration:
- ✅ Update tax rates
- ✅ Update fee distribution
- ✅ Router settings
- ❌ Cannot whitelist/blacklist
- ❌ Cannot pause contracts

---

## ⚠️ Important Notes

1. **Testnet First**: Always test on testnet (chain 1449000) before mainnet
2. **Irreversible Actions**: "Remove Limits" is permanent!
3. **Gas Costs**: All actions require XRP for transaction fees
4. **Multi-Sig**: Recommended for production admin wallet
5. **Role Enforcement**: All permissions are enforced on-chain by the contract

---

## 🧪 Testing Checklist

Before going to production, test these functions:

- [ ] Launch token
- [ ] Add addresses to whitelist
- [ ] Update tax rates
- [ ] Update fee distribution (verify 100% total)
- [ ] Set AMM pair
- [ ] Distribute fees manually
- [ ] Blacklist an address
- [ ] Grant Operator role to another address
- [ ] Pause token (test transfers stop)
- [ ] Unpause token (test transfers resume)
- [ ] Disable anti-snipe

---

## 🎯 Production Workflow

### **Day 1: Launch**
1. Deploy contracts to mainnet
2. Whitelist early supporters
3. Launch token via admin dashboard
4. Monitor anti-snipe period (20 blocks)

### **Day 2-30: Early Stage**
1. Monitor distributions
2. Adjust fee allocations if needed
3. Manage whitelist/blacklist
4. Disable anti-snipe when stable

### **Month 2+: Maintenance**
1. Grant Operator roles to team
2. Regular distribution monitoring
3. Remove limits when community stable
4. Update tax rates if governance votes

---

## 📞 Support

**Admin Dashboard Issues:**
- Check you're on correct network (1449000)
- Verify your address has a role
- Check console for errors
- Ensure MetaMask is unlocked

**Contract Address:**
- DRIPPY Token: `0x8f5cda96f5c581228c17e89120d10782b40762d1`
- FeeRouter: `0x2891cd71f28bf01be2cae941f51fcccde9ed41a7`

**Explorer:**
- https://evm-sidechain.xrpl.org

---

## 🎉 You're Ready!

Navigate to `/admin` and start managing the DRIPPY ecosystem! 🚀

**Remember:**
- Start with Overview tab to see system status
- Test all functions on testnet first
- Use Emergency tab only in critical situations
- Grant roles carefully (on-chain permissions)

**Happy Managing!** 👑

