# 🔗 Xahau Hooks Deep Dive - DRIPPY Token Utility Implementation

## 📚 **Key Findings from Documentation Study**

### **Hook Architecture Understanding**

**Core Principles:**
- **Layer 1 Smart Contracts**: Hooks run directly on Xahau blockchain, not as external contracts
- **WebAssembly Execution**: All hooks compile to WASM for deterministic, high-performance execution
- **Account-Based**: Each hook is attached to a specific XRPL account
- **Transaction Lifecycle**: Hooks execute BEFORE and/or AFTER transactions
- **Intentionally Limited**: Not Turing-complete for security and performance

**Technical Constraints:**
- **Single Stack Frame**: No dynamic memory allocation
- **Integer Communication**: All data passed via integers/pointers
- **Two Primary Functions**: Only `hook()` and `cbak()` allowed
- **Deterministic Execution**: Same input always produces same output
- **Resource Limits**: Built-in guards prevent infinite loops

### **Critical API Functions for DRIPPY**

**State Management:**
```c
state()           // Read hook state
state_set()       // Write hook state
state_foreign()   // Read other account's hook state
```

**Transaction Control:**
```c
accept()          // Allow transaction to proceed
rollback()        // Reject transaction
emit()            // Create new transaction
```

**Transaction Analysis:**
```c
otxn_type()       // Get transaction type
otxn_field()      // Get transaction field
otxn_param()      // Get transaction parameter
```

**Utility Functions:**
```c
util_raddr()      // Address conversions
util_sha512h()    // Hashing functions
hook_param()      // Get hook parameters
```

## 🎯 **DRIPPY Token Utility System Design**

### **Our Hook Strategy**

**Problem We're Solving:**
- XRPL tokens lack native utility beyond transfers
- Need automated reward distribution
- Want to incentivize holding and engagement
- Require anti-sniping and fair distribution

**Hook-Based Solution:**
1. **Fee Router Hook** - Automatically distribute protocol fees
2. **Claim Hook** - Allow users to claim accumulated rewards
3. **Utility Hook** - Add transaction-based utility features

### **Detailed Hook Architecture**

#### **1. Fee Router Hook (Primary Utility Generator)**

**Purpose**: Automatically route protocol fees to reward pools
**Account**: Treasury/Issuer account
**Triggers**: All incoming payments to treasury

```c
// Pseudo-code structure
int64_t hook(int64_t reserved) {
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Get payment amount
    uint64_t amount = get_payment_amount();

    // Calculate allocations
    uint64_t nft_share = amount * NFT_ALLOCATION / 100;
    uint64_t holder_share = amount * HOLDER_ALLOCATION / 100;
    uint64_t treasury_share = amount * TREASURY_ALLOCATION / 100;
    uint64_t amm_share = amount * AMM_ALLOCATION / 100;

    // Emit distribution transactions
    emit_payment(NFT_POOL_ACCOUNT, nft_share);
    emit_payment(HOLDER_POOL_ACCOUNT, holder_share);
    emit_payment(TREASURY_ACCOUNT, treasury_share);
    emit_payment(AMM_POOL_ACCOUNT, amm_share);

    return accept(0,0,0);
}
```

**Key Features:**
- **Automatic Fee Splitting**: No manual intervention needed
- **Configurable Allocations**: Parameterized distribution percentages
- **Anti-Sniping**: Time-based restrictions on certain transactions
- **Transparent Operations**: All distributions visible on-ledger

#### **2. Claim Hook (Reward Distribution)**

**Purpose**: Allow users to claim accumulated rewards
**Account**: Reward pool accounts (NFT Pool, Holder Pool)
**Triggers**: Payments with "CLAIM" memo

```c
// Enhanced claim logic
int64_t hook(int64_t reserved) {
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    if (has_claim_memo()) {
        uint8_t claimant[20];
        otxn_field(SBUF(claimant), sfAccount);

        // Read accrued balance from state
        uint64_t accrued = get_accrued_balance(claimant);

        // Check cooldown and limits
        if (!check_claim_eligibility(claimant)) {
            return rollback(SBUF("cooldown"), 1);
        }

        // Calculate payout amount
        uint64_t payout = min(accrued, MAX_CLAIM_AMOUNT);

        // Emit reward payment
        emit_reward_payment(claimant, payout);

        // Update state
        update_claim_state(claimant, accrued - payout);

        return accept(SBUF("claimed"), 0);
    }

    return accept(0,0,0);
}
```

**Key Features:**
- **Cooldown Protection**: Prevents spam claiming
- **Maximum Limits**: Per-claim and daily limits
- **State Tracking**: Persistent accrual balances
- **Multiple Reward Types**: NFT boosts, holder rewards, staking rewards

#### **3. Utility Hook (Transaction Enhancement)**

**Purpose**: Add utility features to DRIPPY transactions
**Account**: DRIPPY issuer account
**Triggers**: All DRIPPY token transactions

```c
int64_t hook(int64_t reserved) {
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Check if this is a DRIPPY transaction
    if (!is_drippy_transaction()) return accept(0,0,0);

    uint64_t amount = get_drippy_amount();
    uint8_t sender[20], receiver[20];

    otxn_field(SBUF(sender), sfAccount);
    otxn_field(SBUF(receiver), sfDestination);

    // Apply transaction fee (small %)
    uint64_t fee = amount * TRANSACTION_FEE_BPS / 10000;

    // Send fee to treasury
    emit_payment(TREASURY_ACCOUNT, fee);

    // Track transaction for rewards
    track_transaction_activity(sender, receiver, amount);

    // Anti-sniping during launch period
    if (is_anti_sniping_active() && is_suspicious_transaction()) {
        return rollback(SBUF("anti-snipe"), 1);
    }

    return accept(0,0,0);
}
```

### **State Management Schema**

#### **Claim Hook State**
```c
// Key: DRIPPY:CLAIM:v1 + 20-byte account ID
struct ClaimState {
    uint64_t accrued_drops;     // Total accrued rewards (in drops)
    uint64_t last_claim_epoch;  // Last claim timestamp
    uint32_t claim_count;       // Total claims made
    uint32_t reserved;          // Future use
};
```

#### **Fee Router State**
```c
// Key: DRIPPY:ROUTER:v1 + data type
struct RouterState {
    uint64_t total_distributed; // Total fees distributed
    uint64_t nft_pool_total;    // Total sent to NFT pool
    uint64_t holder_pool_total; // Total sent to holder pool
    uint64_t treasury_total;    // Total kept in treasury
    uint64_t amm_pool_total;    // Total sent to AMM
};
```

#### **Activity Tracking State**
```c
// Key: DRIPPY:ACTIVITY:v1 + 20-byte account ID
struct ActivityState {
    uint64_t total_volume;      // Total transaction volume
    uint64_t transaction_count; // Number of transactions
    uint64_t last_activity;     // Last transaction timestamp
    uint32_t boost_multiplier;  // NFT-based boost (if applicable)
};
```

## 🛠️ **Implementation Strategy**

### **Phase 1: Core Hook Development**

1. **Enhanced Claim Hook**
   - Add proper parameter handling
   - Implement robust state management
   - Add comprehensive error handling
   - Support both XRP and IOU payouts

2. **Fee Router Hook** (NEW)
   - Create from scratch based on documentation
   - Implement automatic fee distribution
   - Add anti-sniping mechanisms
   - Support configurable allocations

3. **Testing Framework**
   - Local testing with hook simulator
   - Testnet deployment and validation
   - Integration testing with frontend

### **Phase 2: Advanced Features**

1. **NFT Integration**
   - Hook reads NFT ownership
   - Applies boost multipliers
   - Tracks NFT-specific rewards

2. **Dynamic Parameters**
   - Admin-adjustable allocations
   - Time-based parameter changes
   - Governance integration

3. **Performance Optimization**
   - Optimize state reads/writes
   - Minimize transaction emissions
   - Reduce computational overhead

### **Phase 3: Production Deployment**

1. **Security Audit**
   - Code review and testing
   - State corruption prevention
   - Edge case handling

2. **Mainnet Deployment**
   - Staged rollout
   - Monitoring and alerting
   - Emergency procedures

## 🔧 **Technical Implementation Details**

### **Hook Compilation Process**

**Using Docker (Recommended):**
```bash
# Build claim hook
cd backend/hooks
make docker-build

# Outputs:
# - build/drippy_claim_hook.wasm
# - build/drippy_claim_hook.wasm.hex
```

**Hook Builder Image:**
- Uses `ghcr.io/xrplf/hooks-builder:latest`
- Includes all necessary compilation tools
- Produces deterministic WASM output

### **Deployment Process**

**1. Prepare Hook Bytecode:**
```bash
# Compile hook to WASM
make docker-build

# Generate deployment transaction
node build-sethook-from-env.js
```

**2. Set Hook Parameters:**
```javascript
const setHookParams = {
  ADMIN: adminAccountId,           // 20 bytes
  MAXP: maxClaimAmount,           // 8 bytes (u64)
  COOLD: cooldownSeconds,         // 8 bytes (u64)
  CUR: drippyCurrencyCode,        // 20 bytes
  ISSUER: drippyIssuerAccount     // 20 bytes
};
```

**3. Submit SetHook Transaction:**
```javascript
const setHookTx = {
  TransactionType: "SetHook",
  Account: hookAccount,
  Hooks: [{
    Hook: {
      HookOn: "0x0000000000000000",  // Transaction types to trigger
      HookNamespace: "DRIPPY000000000000000000000000",
      HookApiVersion: 0,
      CreateCode: hookWasmHex,
      HookParameters: setHookParams
    }
  }]
};
```

### **Off-Ledger Components**

**Enhanced Indexer:**
- Monitors XRPL/Xahau for DRIPPY transactions
- Calculates NFT holder boosts
- Computes proportional rewards
- Pushes accruals to hook state via admin transactions

**Admin API Integration:**
- Real-time hook state monitoring
- Manual accrual adjustments
- Parameter updates
- Performance metrics

## 🎯 **DRIPPY Token Utility Features**

### **Automatic Utility Generation**
1. **Transaction Fees → Rewards**: Every protocol fee automatically becomes rewards
2. **Holding Rewards**: Proportional to DRIPPY balance and hold time
3. **NFT Boosts**: Enhanced rewards for NFT holders
4. **Activity Rewards**: Bonuses for active ecosystem participation

### **Real Utility Examples**
1. **DeFi Integration**: Fee sharing from DEX trades
2. **Gaming Integration**: In-game purchases generate rewards
3. **Merchant Adoption**: Payment fees become holder rewards
4. **Staking Rewards**: Lock DRIPPY for enhanced APY

### **Anti-Gaming Mechanisms**
1. **Anti-Sniping**: Time-based restrictions during launches
2. **Cooldown Periods**: Prevent reward farming
3. **Maximum Limits**: Cap per-claim amounts
4. **Activity Requirements**: Minimum engagement for rewards

This hook-based system transforms DRIPPY from a simple token into a **utility-generating asset** where every transaction in the ecosystem benefits token holders through automated, trustless reward distribution.