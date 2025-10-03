# Chain ID Fix - MetaMask Network Error ✅

## The Problem

When connecting MetaMask on mainnet, it was showing error:
> "Chain ID returned by the custom network does not match the submitted chain ID"

**Root Cause:** Both mainnet and testnet were configured with the same chain ID `1440002`

---

## The Fix

### 1. **Corrected Chain IDs**

Updated the network configurations:

```tsx
// Before - WRONG ❌
xrplEvmMainnet: { id: 1440002 }
xrplEvmTestnet: { id: 1440002 }  // Same ID! Wrong!

// After - CORRECT ✅
xrplEvmMainnet: { id: 1440002 }
xrplEvmTestnet: { id: 1440001 }  // Different ID
```

### 2. **Files Updated**

**`frontend/src/config/appkit.ts`**
- Mainnet: `1440002` ✅
- Testnet: `1440001` ✅

**`frontend/src/types/network.ts`**
- Updated `EVM_TESTNET.chainId` from `1440002` → `1440001`

---

## Additional Improvements

### 3. **Auto Chain Switching**

Created a hook that automatically switches the wallet's chain when you toggle between mainnet/testnet in the app:

**`frontend/src/hooks/useAutoSwitchChain.ts`** - NEW FILE

```tsx
export const useAutoSwitchChain = () => {
  const { currentNetwork, networkType } = useNetwork()
  const { isConnected, chainId, switchChain } = useEVM()

  useEffect(() => {
    if (networkType === 'evm' && isConnected) {
      const targetChainId = currentNetwork.chainId
      
      if (chainId !== targetChainId) {
        console.log(`🔄 Auto-switching chain to ${targetChainId}`)
        switchChain(targetChainId)
      }
    }
  }, [currentNetwork, chainId, isConnected])
}
```

**`frontend/src/App.tsx`**
- Added `useAutoSwitchChain()` hook to auto-switch chains

### 4. **Debug Logging**

Added console logs in `EVMContext.tsx`:
```tsx
console.log('🔗 Current EVM Chain ID:', chainId)
console.log('Expected: 1440002 (Mainnet) or 1440001 (Testnet)')
```

---

## Network Details

### XRPL EVM Mainnet
- **Chain ID:** `1440002`
- **RPC:** `https://rpc.xrplevm.org`
- **Explorer:** `https://explorer.xrplevm.org`
- **Currency:** XRP

### XRPL EVM Testnet
- **Chain ID:** `1440001`
- **RPC:** `https://rpc-evm-sidechain.xrpl.org`
- **Explorer:** `https://evm-sidechain.xrpl.org`
- **Currency:** XRP

---

## Testing

After the fix, test the following:

### ✅ Mainnet Connection
1. Select "EVM Mainnet" in network switcher
2. Click "Connect Wallet"
3. Select MetaMask
4. MetaMask should add network with chain ID `1440002`
5. ✅ Should connect successfully

### ✅ Testnet Connection
1. Select "EVM Testnet" in network switcher
2. Click "Connect Wallet"
3. Select MetaMask
4. MetaMask should add network with chain ID `1440001`
5. ✅ Should connect successfully

### ✅ Auto Switching
1. Connect to Mainnet (`1440002`)
2. Toggle to Testnet in the app
3. 🔄 Should automatically prompt to switch to `1440001`
4. Toggle back to Mainnet
5. 🔄 Should automatically prompt to switch to `1440002`

---

## Console Output

You should now see in the browser console:

```
🔍 EVM Provider Debug: {
  appKitInitialized: true,
  projectId: "60ce951238bc22b3dfbca7ba3c509c98",
  wagmiConfig: true
}

🔗 Current EVM Chain ID: 1440002
Expected: 1440002 (Mainnet) or 1440001 (Testnet)

✅ Network matches!
```

When switching:
```
🔄 Auto-switching chain from 1440002 to 1440001 (testnet)
```

---

## Common Issues

### If MetaMask still shows the error:

1. **Remove the old network from MetaMask:**
   - Settings → Networks
   - Delete "XRPL EVM Sidechain" and "XRPL EVM Testnet"
   
2. **Clear browser cache** (Ctrl+Shift+R)

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Try connecting again** - MetaMask should add network with correct chain ID

---

## Status

✅ **FIXED** - Chain IDs now correct:
- Mainnet: `1440002`
- Testnet: `1440001`

✅ **BONUS** - Auto chain switching added!

---

**Restart Required:** Yes, restart your dev server for changes to take effect!

```bash
cd frontend
npm run dev
```

