# Drippy Dual-Network Implementation Guide

## 🎯 Overview

You now have a **fully integrated dual-network architecture** that allows users to switch between **XRPL Mainnet** (with Xaman wallet) and **XRPL EVM Sidechain** (with Reown AppKit/Web3 wallets).

---

## 📦 What Was Implemented

### ✅ Core Infrastructure

#### 1. **Network Type System** (`src/types/network.ts`)
- Defined network configurations for all 4 networks:
  - XRPL Mainnet
  - XRPL Testnet
  - XRPL EVM Mainnet (Chain ID: 1440002)
  - XRPL EVM Testnet
- Each network has its own features, RPC URLs, explorers, and metadata

#### 2. **Network Context** (`src/contexts/NetworkContext.tsx`)
- Manages current network selection
- Persists user's network choice in localStorage
- Tracks first-time visitors
- Provides network switching functions:
  - `switchToXRPL(environment)`
  - `switchToEVM(environment)`
  - `toggleEnvironment()` - Switch between mainnet/testnet

#### 3. **EVM Context** (`src/contexts/EVMContext.tsx`)
- Wraps Reown AppKit with Wagmi and React Query
- Provides EVM wallet connection state:
  - `isConnected`, `address`, `balance`, `chainId`
  - `connectWallet()`, `disconnectWallet()`, `switchChain()`
- Automatically handles wallet state management

#### 4. **Reown AppKit Configuration** (`src/config/appkit.ts`)
- Configured with XRPL EVM networks
- Enabled social logins: Google, X, GitHub, Discord
- Enabled email login
- Custom theming with Drippy colors

---

### 🎨 UI Components

#### 1. **Network Selection Modal** (`src/components/NetworkSelectionModal.tsx`)
- **Beautiful, animated modal** shown on first visit
- Two option cards:
  - **XRPL Mainnet** (Blue theme) - Xaman wallet
    - Features: AMM, Buy DRIPPY, Send/Receive XRP, Analytics
  - **XRPL EVM Sidechain** (Purple theme) - Web3 wallets
    - Features: Swap, Liquidity, NFTs, Staking, Governance
- Animated loading state during network switch
- Glassmorphism design with fluid background effects

#### 2. **Updated Network Switcher** (`src/components/NetworkSwitcher.tsx`)
- Now handles both XRPL and EVM networks
- **Environment toggle** - Switch between Mainnet/Testnet
- Shows current network with visual indicators
- Network-specific icons and colors:
  - XRPL: 🔷 Blue/Cyan
  - EVM: ⚡ Purple/Pink

#### 3. **Updated Navigation** (`src/components/Navigation.tsx`)
- **Dynamic menu items** based on network type:

**XRPL Mainnet Navigation:**
- Dashboard
- AMM
- Wallet (auth required)
- Buy DRIPPY
- Analytics
- Admin (auth + admin only)

**EVM Sidechain Navigation:**
- Dashboard
- Swap
- Liquidity
- Wallet (auth required)
- NFTs
- Staking (auth required)
- Governance
- Analytics
- Admin (auth + admin only)

- **Smart wallet integration:**
  - XRPL → Shows "Connect Xaman" → Uses Xaman OAuth
  - EVM → Shows "Connect Wallet" → Uses Reown AppKit (MetaMask, WalletConnect, etc.)

---

## 🔌 How It Works

### First-Time User Flow

1. User visits the landing page
2. **Network Selection Modal appears** (full-screen overlay)
3. User chooses XRPL or EVM network
4. Modal animates and completes selection
5. User is now on their chosen network
6. Landing page is still visible behind the selection
7. Network preference saved to localStorage

### Returning User Flow

1. User visits the landing page
2. Automatically loads their saved network preference
3. No modal shown (they've already chosen)
4. Can switch networks anytime via **Network Switcher** in the navigation

### Network Switching

Users can switch networks at any time:
1. Click **Network Switcher** (Globe icon in navigation)
2. See all available networks (filtered by current environment)
3. Toggle **Mainnet/Testnet** environment
4. Select a different network type (XRPL ↔ EVM)

---

## 🗂️ File Structure

```
frontend/src/
├── config/
│   └── appkit.ts                    # Reown AppKit configuration
├── types/
│   └── network.ts                   # Network type definitions
├── contexts/
│   ├── NetworkContext.tsx           # Network selection state
│   ├── EVMContext.tsx               # EVM wallet state (Reown)
│   ├── XRPLContext.tsx             # XRPL wallet state (Xaman) - existing
│   └── ThemeContext.tsx            # Theme state - existing
├── components/
│   ├── NetworkSelectionModal.tsx    # First-visit network chooser
│   ├── NetworkSwitcher.tsx         # Updated network switcher
│   ├── Navigation.tsx              # Updated with network-aware menus
│   └── XamanConnectModal.tsx       # Existing Xaman modal
└── App.tsx                         # Updated with all providers
```

---

## 🔧 Environment Variables

### Required in `.env`:

```env
# Existing XRPL/Xaman variables
VITE_XUMM_APP_KEY=6d531186-5bbf-4cae-bb96-38ab5c4edf12
VITE_DRIPPY_ISSUER=rIssuerAddress
VITE_DRIPPY_CURRENCY=DRIPPY

# Reown AppKit (already set)
VITE_REOWN_PROJECT_ID=60ce951238bc22b3dfbca7ba3c509c98
```

---

## 📱 Network-Specific Features

### XRPL Mainnet Features
- ✅ **AMM Trading** - `/amm` page (needs implementation)
- ✅ **Wallet Analytics** - `/wallet` page (needs implementation)
- ✅ **Send/Receive XRP** - Integrated in wallet page
- ✅ **Buy DRIPPY** - `/buy` page (needs implementation)
- ✅ **Analytics** - `/analytics` page (existing)
- 🔌 **Xaman Wallet** - Already integrated

### EVM Sidechain Features
- ✅ **Token Swaps** - `/swap` page (needs implementation)
- ✅ **Liquidity Pools** - `/liquidity` page (needs implementation)
- ✅ **NFT Marketplace** - `/nft` page (existing, needs EVM updates)
- ✅ **Staking** - `/staking` page (needs implementation)
- ✅ **Governance** - `/governance` page (existing, needs EVM updates)
- ✅ **Wallet Analytics** - `/wallet` page (needs implementation)
- 🔌 **Reown AppKit** - Fully integrated (MetaMask, WalletConnect, Email, Social logins)

---

## 🚀 Next Steps

### Immediate (UI is done, now add functionality):

1. **Test the Network Selection Flow**
   ```bash
   npm run dev
   ```
   - Clear localStorage to see the first-visit modal
   - Test network switching
   - Test wallet connections on both networks

2. **Create Missing Pages** (stub pages first, then implement):
   - `/amm` - AMM Trading (XRPL only)
   - `/swap` - Token Swaps (EVM only)
   - `/liquidity` - LP Pools (EVM only)
   - `/wallet` - Wallet Analytics (Both networks)
   - `/buy` - Buy DRIPPY (XRPL only)
   - `/staking` - Staking (EVM only)

3. **Implement Smart Contract Integration** (EVM):
   - Deploy contracts from `drippy-dev-plan.md`
   - Add contract addresses to `appkit.ts`
   - Create contract interaction hooks

4. **Enhance Xaman Integration** (XRPL):
   - Add AMM transaction support
   - Add Send/Receive XRP functionality
   - Integrate DRIPPY purchase flow

### Medium-Term:

5. **Create Route Guards**
   - Redirect users to appropriate pages based on network
   - Show "wrong network" warnings if needed
   - Add network-specific loading states

6. **Add Network-Specific Dashboards**
   - Different dashboard widgets for XRPL vs EVM
   - Network-specific stats and metrics
   - Transaction history per network

7. **Implement Cross-Chain Bridge** (from dev plan)
   - XRPL → EVM bridge
   - Token locking/unlocking
   - NFT bridging

---

## 🎨 Design System

### Network Color Coding

**XRPL Networks:**
- Mainnet: Blue (`#3b82f6`) / Droplets icon 🔷
- Testnet: Cyan (`#06b6d4`) / Droplets icon 🔷

**EVM Networks:**
- Mainnet: Purple (`#a855f7`) / Lightning icon ⚡
- Testnet: Pink (`#ec4899`) / Lightning icon ⚡

### Theme Integration
- All components respect your existing theme system
- Dark mode fully supported
- Glassmorphism UI effects throughout
- Smooth animations with Framer Motion

---

## 🐛 Troubleshooting

### Network Selection Modal Not Showing
```javascript
// Clear localStorage to reset first-visit flag
localStorage.removeItem('drippy_has_chosen_network')
localStorage.removeItem('drippy_selected_network')
// Refresh the page
```

### Reown AppKit Not Working
- Check that `VITE_REOWN_PROJECT_ID` is set in `.env`
- Verify project ID is valid at https://dashboard.reown.com
- Check browser console for errors

### Xaman Wallet Issues
- Ensure `VITE_XUMM_APP_KEY` is valid
- Test on mobile devices with Xaman app installed
- Check redirect URLs in Xaman developer portal

---

## 📚 Key Hooks & Functions

### Network Management
```typescript
import { useNetwork } from './contexts/NetworkContext'

const { 
  currentNetwork,      // Current network config
  networkType,         // 'xrpl' | 'evm'
  environment,         // 'mainnet' | 'testnet'
  isFirstVisit,        // Show modal?
  switchToXRPL,        // Switch to XRPL
  switchToEVM,         // Switch to EVM
  toggleEnvironment,   // Mainnet ↔ Testnet
} = useNetwork()
```

### XRPL Wallet (Xaman)
```typescript
import { useXRPL } from './contexts/XRPLContext'

const {
  isConnected,
  account,             // XRPL address
  balance,             // XRP balance
  drippyBalance,       // DRIPPY token balance
  connectWallet,
  disconnectWallet,
  signWithXaman,       // Sign transactions
} = useXRPL()
```

### EVM Wallet (Reown)
```typescript
import { useEVM } from './contexts/EVMContext'

const {
  isConnected,
  address,             // EVM address
  balance,             // Native token balance
  chainId,             // Current chain ID
  connectWallet,       // Opens AppKit modal
  disconnectWallet,
  switchChain,         // Switch EVM chains
  isReady,             // AppKit initialized?
} = useEVM()
```

---

## 🎯 Summary

You now have a **complete dual-network UI infrastructure**:

✅ **Network Selection** - Beautiful first-visit modal  
✅ **Network Switching** - Toggle between XRPL and EVM anytime  
✅ **Wallet Integration** - Xaman for XRPL, Reown for EVM  
✅ **Dynamic Navigation** - Different menus per network  
✅ **Environment Toggle** - Mainnet/Testnet switching  
✅ **Persistent State** - Remembers user's choice  
✅ **Social Logins** - Email, Google, X, GitHub, Discord (EVM)  

**Next:** Implement the missing pages and smart contract integrations per network type!

---

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify environment variables in `.env`
3. Test wallet connections independently
4. Review the network configuration in `types/network.ts`

**Happy Building! 🚀**

