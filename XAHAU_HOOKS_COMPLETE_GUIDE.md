# 🔗 The Complete Guide to Xahau Hooks & XRPL Integration

## 📖 **Table of Contents**
1. [What Are Xahau Hooks](#what-are-xahau-hooks)
2. [Xahau vs XRPL Relationship](#xahau-vs-xrpl-relationship)
3. [Hook Architecture Deep Dive](#hook-architecture-deep-dive)
4. [Hook Development Lifecycle](#hook-development-lifecycle)
5. [Programming Hooks](#programming-hooks)
6. [State Management](#state-management)
7. [Transaction Handling](#transaction-handling)
8. [Deployment & Management](#deployment--management)
9. [Real-World Examples](#real-world-examples)
10. [Best Practices & Patterns](#best-practices--patterns)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 **What Are Xahau Hooks**

### **Core Concept**
Xahau Hooks are **small, efficient smart contracts** that run directly on the Xahau blockchain (a side-chain of XRPL). They are:

- **Layer-1 Native**: Execute directly in the ledger, not as external contracts
- **WebAssembly Based**: Compiled to WASM for deterministic, high-performance execution
- **Account-Attached**: Each hook is installed on a specific account
- **Transaction-Triggered**: Execute before/after transactions on their account
- **Intentionally Limited**: Not Turing-complete for security and performance

### **What Hooks CAN Do**
```c
// Accept or reject transactions
return accept(SBUF("allowed"), 0);
return rollback(SBUF("rejected"), 1);

// Store and read persistent data
state_set(data, data_len, key, key_len);
state(buffer, buffer_len, key, key_len);

// Emit new transactions
emit(transaction_blob);

// Read transaction details
otxn_field(buffer, field_id);
otxn_type(); // Get transaction type
```

### **What Hooks CANNOT Do**
- ❌ Dynamic memory allocation
- ❌ Network calls or external APIs
- ❌ Infinite loops (guard system prevents)
- ❌ Access to other ledgers/chains directly
- ❌ File system access
- ❌ Random number generation

---

## 🌐 **Xahau vs XRPL Relationship**

### **The Two-Ledger System**

```
XRPL (Main Ledger)                    Xahau (Side-Chain)
├── Native Tokens (XRP, IOUs)         ├── Smart Contracts (Hooks)
├── DEX & AMMs                         ├── Advanced Logic
├── Payments & Escrows                 ├── Automated Transactions
├── Multi-sign & Checks                ├── Custom State Storage
└── High TPS, Low Fees                 └── Programmable Behavior

                    ↕️ Bridge
              Cross-Chain Assets
```

### **Bridge Integration**
- **Token Bridging**: XRPL tokens can be bridged to Xahau for hook interaction
- **State Synchronization**: Hooks can react to XRPL events via bridge data
- **Dual-Chain Apps**: Apps can utilize both ledgers simultaneously

### **Why This Architecture**
1. **XRPL Strengths**: Proven stability, high TPS, regulatory clarity
2. **Xahau Innovation**: Smart contract capability without compromising XRPL
3. **Best of Both**: High-performance base layer + programmable logic layer

---

## 🏗️ **Hook Architecture Deep Dive**

### **Hook Execution Model**

```c
// Hook Lifecycle
Transaction → Pre-Hook → Transaction Processing → Post-Hook → Result

// Hook Functions (only 2 allowed)
int64_t hook(int64_t reserved);  // Main hook execution
int64_t cbak(int64_t reserved);  // Callback (rarely used)
```

### **Memory Model**
```c
// Single Stack Frame - No Dynamic Allocation
uint8_t buffer[256];        // ✅ Stack allocation
uint8_t* ptr = malloc(100); // ❌ Not allowed

// All data via pointers and sizes
int64_t result = state(buffer, sizeof(buffer), key, key_len);
```

### **Hook Installation**
```javascript
// SetHook Transaction
{
  "TransactionType": "SetHook",
  "Account": "rHookAccount...",
  "Hooks": [{
    "Hook": {
      "CreateCode": "0x0061736D01000000...", // WASM bytecode
      "HookOn": "0xFFFFFFFFFFFFFFFF",         // Which transactions trigger
      "HookNamespace": "4D594E414D455350414345000000000000000000000000000000000000000000",
      "HookApiVersion": 0,
      "HookParameters": [/* parameter array */]
    }
  }]
}
```

### **Hook Triggers (HookOn Field)**
```c
// Transaction Type Flags (bitwise)
#define tfPayment       0x0000000000000001
#define tfEscrowCreate  0x0000000000000002
#define tfEscrowFinish  0x0000000000000004
#define tfOfferCreate   0x0000000000000008
// ... etc

// Example: Only trigger on Payments
"HookOn": "0x0000000000000001"

// Trigger on all transactions
"HookOn": "0xFFFFFFFFFFFFFFFF"
```

---

## 🔧 **Hook Development Lifecycle**

### **1. Development Environment**

**Prerequisites:**
```bash
# Docker for compilation
docker --version

# Node.js for deployment scripts
node --version

# Git for version control
git --version
```

**Project Structure:**
```
project/
├── hooks/
│   ├── src/
│   │   ├── my_hook.c          # Hook source code
│   │   └── include/           # Header files
│   ├── build/                 # Compiled outputs
│   ├── Makefile              # Build configuration
│   └── deploy.js             # Deployment script
├── scripts/
│   ├── test-hook.js          # Testing utilities
│   └── monitor.js            # Monitoring tools
└── .env                      # Configuration
```

### **2. Compilation Process**

**Makefile Example:**
```makefile
HOOKS_IMAGE = ghcr.io/xrplf/hooks-builder:latest
SRC = src/my_hook.c
OUT = build/my_hook.wasm
HEX = build/my_hook.wasm.hex

build:
	@mkdir -p build
	@docker run --rm -v $(PWD):/work -w /work $(HOOKS_IMAGE) \
		bash -lc "make -C /opt/hooks build && \
		cc -I/opt/hooks/include -O3 -c $(SRC) -o build/hook.o && \
		/opt/hooks/bin/hook-build build/hook.o -o $(OUT) && \
		xxd -p $(OUT) > $(HEX)"
```

**Build Process:**
```bash
# 1. Compile C to object file
cc -I/opt/hooks/include -O3 -c src/my_hook.c -o build/hook.o

# 2. Link to WebAssembly
/opt/hooks/bin/hook-build build/hook.o -o build/my_hook.wasm

# 3. Convert to hex for deployment
xxd -p build/my_hook.wasm > build/my_hook.wasm.hex
```

### **3. Testing Strategy**

**Local Testing:**
```javascript
// Simulate hook execution
const { simulateHook } = require('./test-utils');

const result = simulateHook({
  hookWasm: fs.readFileSync('build/my_hook.wasm'),
  transaction: {
    TransactionType: 'Payment',
    Account: 'rSender...',
    Destination: 'rReceiver...',
    Amount: '1000000'
  },
  hookAccount: 'rHookAccount...',
  parameters: {
    'PARAM1': 'value1'
  }
});
```

**Testnet Testing:**
```javascript
// Deploy to testnet
const deployment = await deployHook({
  network: 'wss://hooks-testnet-v3.xrpl-labs.com',
  hookAccount: 'rTestAccount...',
  adminSeed: 'sTestSeed...',
  hookWasm: hookHexData,
  parameters: testParameters
});
```

---

## 💻 **Programming Hooks**

### **Basic Hook Structure**

```c
#include "hookapi.h"

// Main hook function
int64_t hook(int64_t reserved) {
    // 1. Check transaction type
    if (otxn_type() != ttPAYMENT) {
        return accept(0,0,0); // Ignore non-payments
    }

    // 2. Read transaction data
    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);

    uint64_t amount = 0;
    uint8_t amount_buf[8];
    if (otxn_field(SBUF(amount_buf), sfAmount) == 8) {
        amount = UINT64_FROM_BUF(amount_buf);
    }

    // 3. Apply logic
    if (amount < 1000000) { // Less than 1 XRP
        return rollback(SBUF("minimum 1 XRP"), 1);
    }

    // 4. Update state or emit transactions
    uint8_t key[32] = "TOTAL_PROCESSED";
    uint64_t total = 0;

    // Read current total
    uint8_t total_buf[8];
    if (state(SBUF(total_buf), key, 32) == 8) {
        total = UINT64_FROM_BUF(total_buf);
    }

    // Update total
    total += amount;
    UINT64_TO_BUF(total_buf, total);
    state_set(SBUF(total_buf), key, 32);

    return accept(SBUF("processed"), 0);
}

// Callback function (usually empty)
int64_t cbak(int64_t reserved) {
    return 0;
}
```

### **Essential API Functions**

**Transaction Analysis:**
```c
// Get transaction type
int32_t tx_type = otxn_type();

// Get transaction fields
otxn_field(buffer, buffer_len, field_id);
otxn_field(SBUF(account), sfAccount);           // Sender
otxn_field(SBUF(destination), sfDestination);  // Receiver
otxn_field(SBUF(amount), sfAmount);             // Amount

// Get transaction size
int64_t tx_size = otxn_size();

// Get specific field size
int64_t field_size = otxn_field_size(sfMemos);
```

**State Management:**
```c
// Read state
int64_t state(
    uint8_t* read_ptr,     // Output buffer
    int64_t read_len,      // Buffer size
    uint8_t* key_ptr,      // State key
    int64_t key_len        // Key size
);

// Write state
int64_t state_set(
    uint8_t* data_ptr,     // Data to store
    int64_t data_len,      // Data size
    uint8_t* key_ptr,      // State key
    int64_t key_len        // Key size
);

// Foreign state (other accounts)
int64_t state_foreign(
    uint8_t* read_ptr,     // Output buffer
    int64_t read_len,      // Buffer size
    uint8_t* key_ptr,      // State key
    int64_t key_len,       // Key size
    uint8_t* namespace,    // Hook namespace
    int64_t namespace_len, // Namespace size
    uint8_t* account,      // Account ID
    int64_t account_len    // Account size
);
```

**Transaction Emission:**
```c
// Reserve emission slots
int64_t etxn_reserve(int64_t count);

// Emit transaction
int64_t emit(uint8_t* tx_blob, int64_t tx_len);

// Simple payment emission (if helper available)
#ifdef HAVE_SIMPLE_EMIT
int prepare_payment_simple_drops(
    uint8_t* buf,
    int64_t buf_len,
    uint8_t* to_account,
    uint64_t drops_amount
);
#endif
```

**Parameters & Utilities:**
```c
// Read hook parameters
int64_t hook_param(
    uint8_t* write_ptr,    // Output buffer
    int64_t write_len,     // Buffer size
    uint8_t* name_ptr,     // Parameter name
    int64_t name_len       // Name size
);

// Utility functions
int64_t util_raddr(
    uint8_t* write_ptr,    // Output buffer
    int64_t write_len,     // Buffer size
    uint8_t* account_id,   // 20-byte account ID
    int64_t account_id_len // Should be 20
);

int64_t util_sha512h(
    uint8_t* write_ptr,    // Output buffer (32 bytes)
    int64_t write_len,     // Should be 32
    uint8_t* data_ptr,     // Input data
    int64_t data_len       // Input size
);
```

---

## 🗄️ **State Management**

### **State Storage Model**

```c
// State Key Structure (32 bytes max)
// Namespace (12 bytes) + Identifier (20 bytes)
uint8_t key[32];
memcpy(key, "MYAPP:DATA:", 11);           // Namespace prefix
memcpy(key + 11, account_id, 20);        // Account-specific data
key[31] = 0;                              // Null terminator

// State Value (variable size, practical limit ~1KB)
struct MyData {
    uint64_t counter;
    uint64_t timestamp;
    uint32_t flags;
    uint8_t  data[100];
};
```

### **State Patterns**

**1. Account-Based Storage:**
```c
// Store data per account
void store_account_data(uint8_t* account, uint64_t value) {
    uint8_t key[32];
    make_account_key(key, account);

    uint8_t data[8];
    UINT64_TO_BUF(data, value);

    state_set(SBUF(data), key, 32);
}

uint64_t load_account_data(uint8_t* account) {
    uint8_t key[32];
    make_account_key(key, account);

    uint8_t data[8];
    if (state(SBUF(data), key, 32) == 8) {
        return UINT64_FROM_BUF(data);
    }
    return 0; // Default value
}
```

**2. Global Counters:**
```c
// Global state with fixed keys
#define GLOBAL_COUNTER_KEY "GLOBAL:COUNTER:V1"

void increment_global_counter() {
    uint64_t counter = 0;
    uint8_t data[8];

    // Read current value
    if (state(SBUF(data), GLOBAL_COUNTER_KEY, strlen(GLOBAL_COUNTER_KEY)) == 8) {
        counter = UINT64_FROM_BUF(data);
    }

    // Increment and store
    counter++;
    UINT64_TO_BUF(data, counter);
    state_set(SBUF(data), GLOBAL_COUNTER_KEY, strlen(GLOBAL_COUNTER_KEY));
}
```

**3. Time-Based Data:**
```c
// Store timestamp-based data
struct TimeData {
    uint64_t timestamp;
    uint64_t value;
    uint32_t event_type;
};

void store_time_event(uint32_t event_type, uint64_t value) {
    struct TimeData data = {
        .timestamp = ledger_time(),
        .value = value,
        .event_type = event_type
    };

    uint8_t key[32];
    sprintf(key, "TIME:%llu", data.timestamp);

    state_set((uint8_t*)&data, sizeof(data), key, strlen(key));
}
```

---

## 📨 **Transaction Handling**

### **Transaction Flow Control**

```c
// Return codes determine transaction fate
return accept(0,0,0);                    // Allow transaction
return accept(SBUF("reason"), 0);        // Allow with message
return rollback(SBUF("error"), 1);       // Reject transaction
return rollback(SBUF("error"), 60);      // Reject with specific code
```

### **Reading Transaction Data**

**Basic Transaction Info:**
```c
// Transaction type
int32_t tx_type = otxn_type();
switch (tx_type) {
    case ttPAYMENT:
        // Handle payment
        break;
    case ttOFFER_CREATE:
        // Handle offer
        break;
    default:
        return accept(0,0,0); // Ignore others
}

// Transaction accounts
uint8_t sender[20], receiver[20];
otxn_field(SBUF(sender), sfAccount);
otxn_field(SBUF(receiver), sfDestination);
```

**Payment Analysis:**
```c
// Get payment amount
uint64_t get_payment_amount() {
    uint8_t amount_buf[8];
    if (otxn_field(SBUF(amount_buf), sfAmount) == 8) {
        return UINT64_FROM_BUF(amount_buf);
    }

    // Handle IOU amounts (more complex)
    uint8_t amount_field[48];
    int64_t amount_size = otxn_field(amount_field, 48, sfAmount);
    if (amount_size == 48) {
        // Parse IOU amount structure
        // [8 bytes: not XRP] [20 bytes: currency] [20 bytes: issuer]
        // Implementation depends on IOU format
    }

    return 0;
}
```

**Memo Processing:**
```c
// Read memos for commands
int process_memos() {
    uint32_t memos_slot = otxn_field_slot(sfMemos, 0);
    if (memos_slot == DOESNT_EXIST) return 0;

    for (int i = 0; ; i++) {
        uint32_t memo_arr = slot_subarray(memos_slot, i);
        if (memo_arr == DOESNT_EXIST) break;

        uint32_t memo_obj = slot_subfield(memo_arr, sfMemo, 0);
        if (memo_obj == DOESNT_EXIST) continue;

        // Get memo type
        uint32_t type_slot = slot_subfield(memo_obj, sfMemoType, 0);
        if (type_slot != DOESNT_EXIST) {
            uint8_t type_buf[32];
            int64_t type_len = slot(SBUF(type_buf), type_slot);

            if (type_len > 0 && memcmp(type_buf, "COMMAND", 7) == 0) {
                // Process command memo
                uint32_t data_slot = slot_subfield(memo_obj, sfMemoData, 0);
                uint8_t command[256];
                int64_t cmd_len = slot(command, 256, data_slot);
                return process_command(command, cmd_len);
            }
        }
    }
    return 0;
}
```

### **Emitting Transactions**

**Basic Payment Emission:**
```c
int emit_payment(uint8_t* to_account, uint64_t drops) {
    // Reserve emission slot
    etxn_reserve(1);

    // Build payment transaction
    uint8_t tx[200];
    uint8_t* p = tx;

    // Use helper if available
    #ifdef HAVE_SIMPLE_EMIT
    p += PREPARE_PAYMENT_SIMPLE_DROPS(p, 200, 0, to_account, drops);
    #else
    // Manual transaction building required
    // ... complex TLV encoding
    #endif

    // Emit transaction
    int64_t result = emit(tx, p - tx);
    return result >= 0;
}
```

**Complex Transaction Building:**
```c
// Manual transaction construction (when helpers unavailable)
uint8_t* encode_payment_manual(uint8_t* buf, uint8_t* dest, uint64_t amount) {
    uint8_t* p = buf;

    // Transaction Type (Payment = 0)
    *p++ = 0x12; // sfTransactionType
    *p++ = 0x00; // ttPayment

    // Destination
    *p++ = 0x83; // sfDestination
    memcpy(p, dest, 20);
    p += 20;

    // Amount (XRP)
    *p++ = 0x61; // sfAmount
    // Encode amount as XRP (positive, 62-bit)
    uint64_t xrp_amount = amount | 0x4000000000000000ULL;
    for (int i = 7; i >= 0; i--) {
        *p++ = (xrp_amount >> (i * 8)) & 0xFF;
    }

    return p;
}
```

---

## 🚀 **Deployment & Management**

### **Hook Deployment Process**

**1. Parameter Encoding:**
```javascript
function encodeHookParameter(name, value, type = 'string') {
    const nameHex = Buffer.from(name, 'utf8').toString('hex').toUpperCase();

    let valueHex;
    switch (type) {
        case 'account':
            valueHex = xrpl.decodeAccountID(value).toString('hex').toUpperCase();
            break;
        case 'u64':
            const num = BigInt(value);
            valueHex = num.toString(16).padStart(16, '0').toUpperCase();
            break;
        case 'currency':
            valueHex = Buffer.from(value, 'utf8').toString('hex').padEnd(40, '0').toUpperCase();
            break;
        default:
            valueHex = Buffer.from(value, 'utf8').toString('hex').toUpperCase();
    }

    return {
        HookParameter: {
            HookParameterName: nameHex,
            HookParameterValue: valueHex
        }
    };
}
```

**2. SetHook Transaction:**
```javascript
async function deployHook(client, wallet, hookAccount, wasmHex, parameters) {
    const setHookTx = {
        TransactionType: 'SetHook',
        Account: wallet.classicAddress,
        Destination: hookAccount,
        Hooks: [{
            Hook: {
                HookOn: '0xFFFFFFFFFFFFFFFF',  // All transactions
                HookNamespace: Buffer.from('MYAPP', 'utf8').toString('hex').padEnd(64, '0'),
                HookApiVersion: 0,
                CreateCode: wasmHex,
                HookParameters: parameters,
                Flags: 1  // hsfOverride
            }
        }]
    };

    const prepared = await client.autofill(setHookTx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    return result;
}
```

**3. Hook Updates:**
```javascript
// Update parameters without changing code
const updateParams = {
    TransactionType: 'SetHook',
    Account: adminWallet.classicAddress,
    Destination: hookAccount,
    Hooks: [{
        Hook: {
            HookParameters: newParameters,
            Flags: 2  // hsfNSDelete - update only
        }
    }]
};
```

### **Hook Monitoring**

**State Queries:**
```javascript
// Query hook state
async function getHookState(client, hookAccount, stateKey) {
    const request = {
        command: 'ledger_entry',
        hook_state: {
            account: hookAccount,
            key: stateKey,
            namespace: hookNamespace
        }
    };

    const response = await client.request(request);
    return response.result;
}
```

**Transaction Monitoring:**
```javascript
// Monitor hook executions
client.on('transaction', (tx) => {
    if (tx.meta && tx.meta.HookExecutions) {
        tx.meta.HookExecutions.forEach(execution => {
            console.log('Hook executed:', {
                account: execution.HookAccount,
                result: execution.HookReturnCode,
                message: execution.HookReturnString
            });
        });
    }
});
```

---

## 🔧 **Real-World Examples**

### **Example 1: Simple Fee Collector**

```c
// Collects 1% fee on all payments over 10 XRP
#include "hookapi.h"

#define MIN_AMOUNT 10000000    // 10 XRP in drops
#define FEE_PERCENT 1         // 1%
#define FEE_ACCOUNT "rFeeCollector123456789012345"

int64_t hook(int64_t reserved) {
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Get payment amount
    uint64_t amount = 0;
    uint8_t amount_buf[8];
    if (otxn_field(SBUF(amount_buf), sfAmount) == 8) {
        amount = UINT64_FROM_BUF(amount_buf);
    } else {
        return accept(0,0,0); // Skip IOUs
    }

    // Check minimum
    if (amount < MIN_AMOUNT) return accept(0,0,0);

    // Calculate fee
    uint64_t fee = amount / 100; // 1%

    // Emit fee payment
    etxn_reserve(1);
    uint8_t tx[200];
    uint8_t fee_account[20];
    util_accid(SBUF(fee_account), FEE_ACCOUNT, strlen(FEE_ACCOUNT));

    #ifdef HAVE_SIMPLE_EMIT
    uint8_t* p = tx;
    p += PREPARE_PAYMENT_SIMPLE_DROPS(p, 200, 0, fee_account, fee);
    emit(tx, p - tx);
    #endif

    return accept(SBUF("fee collected"), 0);
}

int64_t cbak(int64_t reserved) { return 0; }
```

### **Example 2: Reward Distribution System**

```c
// Distributes rewards based on stored allocations
#include "hookapi.h"

#define REWARD_POOL_KEY "REWARD_POOL"
#define ALLOCATION_PREFIX "ALLOC:"

int64_t hook(int64_t reserved) {
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Check if this is a reward distribution trigger
    uint8_t destination[20];
    otxn_field(SBUF(destination), sfDestination);

    uint8_t my_account[20];
    hook_account(SBUF(my_account));

    if (memcmp(destination, my_account, 20) != 0) {
        return accept(0,0,0); // Not for us
    }

    // Get deposit amount
    uint64_t deposit = 0;
    uint8_t amount_buf[8];
    if (otxn_field(SBUF(amount_buf), sfAmount) == 8) {
        deposit = UINT64_FROM_BUF(amount_buf);
    }

    // Read reward pool balance
    uint64_t pool_balance = 0;
    uint8_t pool_buf[8];
    if (state(SBUF(pool_buf), REWARD_POOL_KEY, strlen(REWARD_POOL_KEY)) == 8) {
        pool_balance = UINT64_FROM_BUF(pool_buf);
    }

    // Add to pool
    pool_balance += deposit;
    UINT64_TO_BUF(pool_buf, pool_balance);
    state_set(SBUF(pool_buf), REWARD_POOL_KEY, strlen(REWARD_POOL_KEY));

    // Distribute rewards if pool is large enough
    if (pool_balance > 100000000) { // 100 XRP
        distribute_rewards(pool_balance / 2); // Distribute half
    }

    return accept(SBUF("reward added"), 0);
}

void distribute_rewards(uint64_t amount) {
    // Read allocation list (simplified)
    // In real implementation, iterate through stored allocations

    etxn_reserve(3); // Reserve for multiple emissions

    // Example distributions
    emit_reward("rHolder1", amount * 40 / 100); // 40%
    emit_reward("rHolder2", amount * 35 / 100); // 35%
    emit_reward("rHolder3", amount * 25 / 100); // 25%
}

void emit_reward(char* account, uint64_t amount) {
    uint8_t account_id[20];
    util_accid(SBUF(account_id), account, strlen(account));

    uint8_t tx[200];
    uint8_t* p = tx;
    p += PREPARE_PAYMENT_SIMPLE_DROPS(p, 200, 0, account_id, amount);
    emit(tx, p - tx);
}

int64_t cbak(int64_t reserved) { return 0; }
```

### **Example 3: Escrow with Conditions**

```c
// Conditional escrow that releases based on external conditions
#include "hookapi.h"

struct EscrowData {
    uint64_t amount;
    uint64_t release_time;
    uint8_t beneficiary[20];
    uint8_t condition_hash[32];
    uint32_t status; // 0=active, 1=released, 2=cancelled
};

int64_t hook(int64_t reserved) {
    uint32_t memo_slot = otxn_field_slot(sfMemos, 0);
    if (memo_slot == DOESNT_EXIST) return accept(0,0,0);

    // Parse memo for command
    char command[32];
    if (parse_memo_command(memo_slot, command, sizeof(command)) <= 0) {
        return accept(0,0,0);
    }

    if (strcmp(command, "CREATE_ESCROW") == 0) {
        return create_escrow();
    } else if (strcmp(command, "RELEASE_ESCROW") == 0) {
        return release_escrow();
    } else if (strcmp(command, "CANCEL_ESCROW") == 0) {
        return cancel_escrow();
    }

    return accept(0,0,0);
}

int64_t create_escrow() {
    uint64_t amount = 0;
    uint8_t amount_buf[8];
    otxn_field(SBUF(amount_buf), sfAmount);
    amount = UINT64_FROM_BUF(amount_buf);

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);

    // Create escrow record
    struct EscrowData escrow = {
        .amount = amount,
        .release_time = ledger_time() + 3600, // 1 hour from now
        .status = 0
    };

    // Get beneficiary from memo data
    // ... parse memo for beneficiary address

    // Store escrow
    uint8_t escrow_key[32];
    make_escrow_key(escrow_key, sender);
    state_set((uint8_t*)&escrow, sizeof(escrow), escrow_key, 32);

    return accept(SBUF("escrow created"), 0);
}

int64_t release_escrow() {
    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);

    // Load escrow
    uint8_t escrow_key[32];
    make_escrow_key(escrow_key, sender);

    struct EscrowData escrow;
    if (state((uint8_t*)&escrow, sizeof(escrow), escrow_key, 32) != sizeof(escrow)) {
        return rollback(SBUF("escrow not found"), 1);
    }

    if (escrow.status != 0) {
        return rollback(SBUF("escrow not active"), 1);
    }

    // Check release conditions
    if (ledger_time() < escrow.release_time) {
        return rollback(SBUF("release time not met"), 1);
    }

    // Release funds
    etxn_reserve(1);
    uint8_t tx[200];
    uint8_t* p = tx;
    p += PREPARE_PAYMENT_SIMPLE_DROPS(p, 200, 0, escrow.beneficiary, escrow.amount);
    emit(tx, p - tx);

    // Mark as released
    escrow.status = 1;
    state_set((uint8_t*)&escrow, sizeof(escrow), escrow_key, 32);

    return accept(SBUF("escrow released"), 0);
}

int64_t cbak(int64_t reserved) { return 0; }
```

---

## ✅ **Best Practices & Patterns**

### **1. Error Handling**

```c
// Always check return values
int64_t result = state(buffer, sizeof(buffer), key, key_len);
if (result < 0) {
    return rollback(SBUF("state read failed"), 1);
}

// Use meaningful error messages
if (amount < minimum) {
    return rollback(SBUF("amount below minimum"), ERROR_INSUFFICIENT_FUNDS);
}

// Validate all inputs
if (!is_valid_account(account_id)) {
    return rollback(SBUF("invalid account"), ERROR_INVALID_ACCOUNT);
}
```

### **2. State Management**

```c
// Use consistent key naming
void make_user_key(uint8_t* key, const char* prefix, uint8_t* account) {
    memset(key, 0, 32);
    int len = strlen(prefix);
    memcpy(key, prefix, len);
    memcpy(key + len, account, 20);
}

// Atomic state updates
int update_balance(uint8_t* account, int64_t delta) {
    uint8_t key[32];
    make_user_key(key, "BALANCE:", account);

    // Read current balance
    uint64_t balance = 0;
    uint8_t balance_buf[8];
    if (state(SBUF(balance_buf), key, 32) == 8) {
        balance = UINT64_FROM_BUF(balance_buf);
    }

    // Check for underflow
    if (delta < 0 && balance < (uint64_t)(-delta)) {
        return 0; // Insufficient balance
    }

    // Update balance
    balance += delta;
    UINT64_TO_BUF(balance_buf, balance);

    return state_set(SBUF(balance_buf), key, 32) >= 0;
}
```

### **3. Performance Optimization**

```c
// Minimize state operations
void batch_update_accounts(struct AccountUpdate* updates, int count) {
    for (int i = 0; i < count; i++) {
        uint8_t key[32];
        make_user_key(key, "BALANCE:", updates[i].account);

        uint8_t balance_buf[8];
        UINT64_TO_BUF(balance_buf, updates[i].new_balance);
        state_set(SBUF(balance_buf), key, 32);
    }
}

// Cache frequently used data
static uint64_t cached_total = 0;
static uint32_t cache_ledger = 0;

uint64_t get_total_with_cache() {
    uint32_t current_ledger = ledger_seq();
    if (cache_ledger == current_ledger) {
        return cached_total; // Use cache
    }

    // Refresh cache
    uint8_t total_buf[8];
    if (state(SBUF(total_buf), "TOTAL", 5) == 8) {
        cached_total = UINT64_FROM_BUF(total_buf);
        cache_ledger = current_ledger;
    }

    return cached_total;
}
```

### **4. Security Patterns**

```c
// Input validation
int validate_payment_amount(uint64_t amount) {
    if (amount == 0) return 0;                    // No zero amounts
    if (amount > 1000000000000ULL) return 0;     // Max 1M XRP
    return 1;
}

// Access control
int is_authorized_admin() {
    uint8_t admin_param[20];
    if (hook_param(SBUF(admin_param), "ADMIN", 5) != 20) {
        return 0; // No admin configured
    }

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);

    return memcmp(admin_param, sender, 20) == 0;
}

// Rate limiting
int check_rate_limit(uint8_t* account) {
    uint8_t key[32];
    make_user_key(key, "RATE:", account);

    uint64_t last_action = 0;
    uint8_t time_buf[8];
    if (state(SBUF(time_buf), key, 32) == 8) {
        last_action = UINT64_FROM_BUF(time_buf);
    }

    uint64_t now = ledger_time();
    if (now - last_action < 60) { // 1 minute cooldown
        return 0; // Rate limited
    }

    // Update last action time
    UINT64_TO_BUF(time_buf, now);
    state_set(SBUF(time_buf), key, 32);

    return 1;
}
```

---

## 🐛 **Troubleshooting Guide**

### **Common Compilation Errors**

**1. Missing Includes:**
```bash
Error: 'SBUF' undeclared
Solution: Add #include "hookapi.h"
```

**2. Function Not Found:**
```bash
Error: undefined reference to 'state'
Solution: Ensure using correct hooks-builder image and linking
```

**3. Parameter Issues:**
```bash
Error: too many arguments to function 'emit'
Solution: Check API documentation - emit(blob, length)
```

### **Runtime Issues**

**1. Hook Not Triggering:**
```javascript
// Check HookOn field
"HookOn": "0x0000000000000001" // Only payments
"HookOn": "0xFFFFFFFFFFFFFFFF" // All transactions
```

**2. State Not Persisting:**
```c
// Ensure state_set returns success
if (state_set(SBUF(data), key, key_len) < 0) {
    return rollback(SBUF("state failed"), 1);
}
```

**3. Emission Failures:**
```c
// Reserve slots before emitting
etxn_reserve(1);

// Check emission result
int64_t result = emit(tx_blob, tx_len);
if (result < 0) {
    return rollback(SBUF("emit failed"), 1);
}
```

### **Debugging Techniques**

**1. Return Code Debugging:**
```c
// Use different return codes for debugging
if (condition1) return accept(SBUF("path1"), 0);
if (condition2) return accept(SBUF("path2"), 0);
return accept(SBUF("path3"), 0);
```

**2. State Inspection:**
```javascript
// Query hook state externally
const state = await client.request({
    command: 'ledger_entry',
    hook_state: {
        account: hookAccount,
        key: stateKey,
        namespace: hookNamespace
    }
});
```

**3. Transaction Analysis:**
```javascript
// Monitor hook executions
client.on('transaction', (tx) => {
    if (tx.meta?.HookExecutions) {
        console.log('Hook results:', tx.meta.HookExecutions);
    }
});
```

---

## 📚 **Additional Resources**

### **Official Documentation**
- [Xahau Hooks Docs](https://docs.xahau.network/)
- [XRPL Hooks API](https://xrpl-hooks.readme.io/)
- [Hooks Builder](https://hooks-builder.xrpl.org/)

### **Development Tools**
- [Hooks Testnet](https://hooks-testnet-v3.xrpl-labs.com)
- [Hook Examples](https://github.com/XRPL-Labs/xahau-hooks-examples)
- [Discord Community](https://discord.gg/xrpl)

### **Learning Path**
1. **Start Simple**: Basic accept/reject hooks
2. **Add State**: Store and retrieve data
3. **Emit Transactions**: Create new transactions
4. **Complex Logic**: Multi-step operations
5. **Production**: Security, monitoring, optimization

---

This comprehensive guide covers everything needed to understand and develop Xahau hooks. Use it as a reference for building sophisticated smart contract functionality on the XRPL ecosystem! 🚀