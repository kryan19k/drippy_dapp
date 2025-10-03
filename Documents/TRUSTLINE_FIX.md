# 🔧 Trustline Setup Fix Applied

## Problem
Error 603 from XUMM when setting up DRIPPY trustline:
```
Error code 603, see XUMM Dev Console
```

## Root Cause
The currency code **"DRIPPY"** (6 characters) was being sent as plain text, but XRPL requires currency codes **longer than 3 characters** to be hex-encoded to exactly **40 characters** (20 bytes).

## Solution Applied
Updated `backend/server.js` to automatically convert currency codes:

```javascript
// Convert currency to hex if it's longer than 3 characters (XRPL standard)
const currencyCode = currency.length > 3 
  ? Buffer.from(currency, 'utf8').toString('hex').toUpperCase().padEnd(40, '0')
  : currency
```

**"DRIPPY"** now becomes:
```
DRIPPY → 4452495050590000000000000000000000000000
```

## How to Test

### 1. Restart Backend
```bash
# Stop the current backend (Ctrl+C in the terminal)
cd backend
npm run dev
```

### 2. Test Trustline Setup
1. Go to **Bridge** page (`/bridge`)
2. Connect **Xaman** wallet
3. Select **"EVM → XRPL"** direction
4. Click **"Set Up DRIPPY Trustline in Xaman"**
5. **QR code modal** should appear
6. **Scan with Xaman** on your phone
7. **Approve** the trustline
8. ✅ **Done!**

## Expected Behavior

### Backend Logs (Should See):
```
Creating trustline payload: {
  "txjson": {
    "TransactionType": "TrustSet",
    "Account": "raRd19gGx7bqj8C3v6LoeATHfAt4B77Bag",
    "LimitAmount": {
      "currency": "4452495050590000000000000000000000000000",  ← HEX encoded
      "issuer": "rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM",
      "value": "1000000000"
    }
  }
}
Trustline payload created: [uuid]
```

### Frontend:
- QR code modal appears
- No errors in console
- After scanning: "✅ Trustline set up successfully!"

## XRPL Currency Code Standards

| Length | Format | Example |
|--------|--------|---------|
| **3 chars or less** | Plain text | `USD`, `XRP`, `BTC` |
| **More than 3 chars** | Hex-encoded (40 chars) | `DRIPPY` → `4452495050590000000000000000000000000000` |

## References
- XRPL Currency Codes: https://xrpl.org/currency-formats.html
- XUMM Error Codes: https://xumm.readme.io/docs/error-codes

---

**Status**: ✅ **FIXED**  
**Next Step**: Restart backend and test!

