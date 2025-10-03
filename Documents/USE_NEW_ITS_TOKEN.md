# Using the New Axelar ITS Token

## Token Info

- **Address**: `0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A`
- **Type**: Axelar ITS Standard Token
- **Features**: Basic ERC-20 with built-in bridging

## Quick Setup

### 1. Update frontend/.env

Replace your current DRIPPY contract addresses:

```bash
# NEW ITS Token (replace the old one)
VITE_DRIPPY_CONTRACT_ADDRESS=0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A

# Keep these
VITE_DRIPPY_ISSUER=rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ
VITE_DRIPPY_CURRENCY=DRIPPY
VITE_DRIPPY_TRUSTLINE_LIMIT=1000000000
```

### 2. Update frontend/contracts/latest.ts

Replace `DRIPPY_TOKEN_ADDRESS`:

```typescript
export const DRIPPY_TOKEN_ADDRESS = '0x3c9DD78A661c5CF6890b6fB05e85d09006360d2A' as `0x${string}`
```

And update the ABI to the ITS ABI you provided.

### 3. Bridge Works Directly!

The ITS token has `interchainTransfer()` built-in, so bridging works immediately:

```typescript
// To bridge, users just call:
await itsToken.interchainTransfer(
  'xrpl',                    // destination chain
  recipientBytes,            // recipient
  amount,                    // amount
  '0x',                      // metadata
  { value: gasFee }
);
```

## Trade-offs

| Feature | OLD Token (0xAb09...) | NEW Token (0x3c9D...) |
|---------|----------------------|----------------------|
| Custom Tax | ✅ Yes (5%) | ❌ No |
| Anti-Snipe | ✅ Yes | ❌ No |
| Fee Distribution | ✅ 4 pools | ❌ No |
| Bridging | ❌ Need setup | ✅ Built-in |
| Complexity | ⚠️ High | ✅ Simple |

## Recommendation

**If you want to launch quickly**: Use the NEW token
**If you want full features**: Bridge the OLD token (more work)


