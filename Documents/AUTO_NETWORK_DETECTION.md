# 🔄 Automatic Network Detection & Switching

## ✅ What's New

The app now **automatically** checks and switches to the correct XRPL EVM network when you connect your wallet!

### **Features:**
1. ✅ **Detects wrong network** on wallet connection
2. ✅ **Automatically switches** to correct network
3. ✅ **Adds network to MetaMask** if not found
4. ✅ **Shows helpful toasts** for user feedback
5. ✅ **Works seamlessly** without user intervention

---

## 🚀 How It Works

### **When You Connect MetaMask:**

#### **Scenario 1: Correct Network** ✅
```
1. You connect MetaMask on Chain 1440002
2. App detects: "Already on correct network!"
3. ✅ Everything works normally
```

#### **Scenario 2: Wrong Network** 🔄
```
1. You connect MetaMask on Chain 1 (Ethereum)
2. App detects: "Wrong network!"
3. App automatically calls MetaMask to switch
4. MetaMask prompts: "Switch to XRPL EVM Devnet?"
5. You click "Switch"
6. ✅ Connected to correct network!
```

#### **Scenario 3: Network Not in MetaMask** ➕
```
1. You connect MetaMask (any chain)
2. App tries to switch to Chain 1440002
3. MetaMask responds: "Chain not found"
4. App automatically adds the network
5. MetaMask prompts: "Allow this site to add a network?"
6. You approve
7. Network is added to MetaMask!
8. App switches to it automatically
9. ✅ Ready to use!
```

---

## 🛠️ Technical Implementation

### **1. `useNetworkCheck` Hook**
**Location:** `frontend/src/hooks/useNetworkCheck.ts`

**What it does:**
- Runs on every wallet connection
- Compares current chain ID with expected chain ID
- Attempts to switch if mismatch detected
- Falls back to adding network if switch fails

**Usage:**
```typescript
// In App.tsx
function AppContent() {
  useNetworkCheck() // That's it! Auto-magic!
  // ...
}
```

### **2. Network Addition Function**
Automatically adds network to MetaMask using:
```typescript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x15f902', // 1440002 in hex
    chainName: 'XRPL EVM Devnet',
    nativeCurrency: {
      name: 'XRP',
      symbol: 'XRP',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.xrplevm.org'],
    blockExplorerUrls: ['https://evm-sidechain.xrpl.org'],
  }]
})
```

### **3. NetworkMismatchModal Component**
**Location:** `frontend/src/components/NetworkMismatchModal.tsx`

**Features:**
- Beautiful modal with network details
- "Switch Network" button
- "Add Network to MetaMask" button
- Shows current vs. expected chain

**(Currently created but not integrated - can be used for manual flow if needed)**

---

## 📊 User Flow Diagram

```
User Connects MetaMask
        ↓
Check Current Chain ID
        ↓
    Is Correct?
    ↙        ↘
  YES         NO
   ↓           ↓
Continue   Try Switch
            ↙      ↘
      Success   Failed
         ↓          ↓
      Done!    Add Network
                    ↓
                  Success
                    ↓
                Switch Again
                    ↓
                  Done!
```

---

## 🎯 Network Details

### **XRPL EVM Devnet (Current Deployment)**
```
Network Name: XRPL EVM Devnet
Chain ID: 1440002 (0x15f902 in hex)
RPC URL: https://rpc.xrplevm.org
Currency: XRP
Explorer: https://evm-sidechain.xrpl.org
```

**Your Contracts:**
- DRIPPY Token: `0x8f5cda96f5c581228c17e89120d10782b40762d1`
- FeeRouter: `0x2891cd71f28bf01be2cae941f51fcccde9ed41a7`

### **XRPL EVM Mainnet (Future)**
```
Network Name: XRPL EVM Sidechain
Chain ID: 1440000 (0x15f900 in hex)
RPC URL: https://rpc.xrplevm.org
Currency: XRP
Explorer: https://explorer.xrplevm.org
```

---

## 🧪 Testing

### **Test 1: Connect on Wrong Network**
1. Connect MetaMask to Ethereum Mainnet (Chain 1)
2. Open the app
3. Switch to EVM network in app
4. Connect wallet
5. **Expected:** MetaMask prompts to switch to Chain 1440002
6. **Result:** ✅ Auto-switches

### **Test 2: Network Not in MetaMask**
1. Remove XRPL EVM Devnet from MetaMask (if exists)
2. Connect MetaMask (any network)
3. Open the app
4. Switch to EVM Devnet in app
5. Connect wallet
6. **Expected:** MetaMask prompts to add network
7. **Result:** ✅ Auto-adds, then switches

### **Test 3: Already on Correct Network**
1. Manually add/switch to Chain 1440002 in MetaMask
2. Open the app
3. Connect wallet
4. **Expected:** No prompts, works immediately
5. **Result:** ✅ Silent success

---

## 🎨 User Experience

### **Toast Notifications:**

**Success Messages:**
- 🟢 "Switched to XRPL EVM Devnet"
- 🟢 "XRPL EVM Devnet added to MetaMask!"

**Error Messages:**
- 🔴 "Failed to switch to XRPL EVM Devnet. Please switch manually in MetaMask."
- 🔴 "Please add XRPL EVM Devnet (Chain ID: 1440002) to MetaMask manually"

**Loading States:**
- Shown during network switch/addition

---

## ⚠️ Edge Cases Handled

### **1. User Rejects Switch**
- Shows toast: "Please switch manually"
- App continues to show wrong network warning

### **2. User Rejects Adding Network**
- Shows toast with manual instructions
- User can try again or add manually

### **3. MetaMask Not Installed**
- Hook gracefully fails
- Normal wallet connection flow continues

### **4. RPC Error**
- Catches and logs error
- Shows user-friendly message

### **5. Multiple Quick Switches**
- Debounced to prevent spam
- Only triggers after wallet fully connected

---

## 🔧 Configuration

### **Supported Networks (Auto-detect):**
Currently hardcoded in `useNetworkCheck.ts`:
- Chain 1440000 (XRPL EVM Mainnet)
- Chain 1440002 (XRPL EVM Devnet)

### **To Add More Networks:**
Update the network configs in:
1. `frontend/src/types/network.ts`
2. `frontend/src/config/appkit.ts`

The hook will automatically handle them!

---

## 📝 Developer Notes

### **How to Disable Auto-Switch (if needed):**
```typescript
// In App.tsx
function AppContent() {
  // useNetworkCheck() // Comment this out
  // ...
}
```

### **How to Add Manual Modal (if needed):**
```typescript
import { NetworkMismatchModal } from './components/NetworkMismatchModal'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Check Network
      </button>
      <NetworkMismatchModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}
```

---

## 🚀 Quick Start

### **For Users:**
1. Connect MetaMask to the app
2. If on wrong network, **just click "Switch" when prompted**
3. If network not found, **click "Allow" when prompted**
4. That's it! 🎉

### **For Developers:**
1. Hook is already integrated in `App.tsx`
2. No additional setup needed
3. Works automatically on wallet connect
4. Check console for debug logs

---

## 🎯 Future Enhancements

Potential improvements:
- [ ] Show network mismatch warning banner (instead of just toast)
- [ ] Add network switcher in header
- [ ] Support more XRPL EVM networks
- [ ] Add network health check (RPC status)
- [ ] Persist user's preferred network

---

## ✅ Status

**Feature:** ✅ Complete and Active!

**What happens now:**
1. User connects MetaMask (any network)
2. App detects mismatch
3. App auto-switches or adds network
4. User confirms in MetaMask
5. Everything works! 🎉

**No manual network setup required!** The app handles it all automatically! 🚀

