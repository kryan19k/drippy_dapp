// DRIPPY Simple Claim Hook - Compatible with Hooks Builder
// Purpose: Basic reward claiming functionality
// Triggers: Payments with "CLAIM" memo to this account

#include "hookapi.h"

// Convert string to pointer for API calls
uint32_t str_to_ptr(const char* str) {
    return (uint32_t)(uintptr_t)str;
}

// Get string length manually
int str_len(const char* str) {
    int len = 0;
    while (str[len] != 0) len++;
    return len;
}

// Compare memory manually
int mem_cmp(const void* a, const void* b, int len) {
    const uint8_t* pa = (const uint8_t*)a;
    const uint8_t* pb = (const uint8_t*)b;
    for (int i = 0; i < len; i++) {
        if (pa[i] != pb[i]) return pa[i] - pb[i];
    }
    return 0;
}

// Copy memory manually
void mem_cpy(void* dest, const void* src, int len) {
    uint8_t* d = (uint8_t*)dest;
    const uint8_t* s = (const uint8_t*)src;
    for (int i = 0; i < len; i++) {
        d[i] = s[i];
    }
}

// Set memory manually
void mem_set(void* ptr, int value, int len) {
    uint8_t* p = (uint8_t*)ptr;
    for (int i = 0; i < len; i++) {
        p[i] = (uint8_t)value;
    }
}

// Convert buffer to uint64
uint64_t buf_to_u64(const uint8_t* buf) {
    uint64_t result = 0;
    for (int i = 0; i < 8; i++) {
        result = (result << 8) | buf[i];
    }
    return result;
}

// Convert uint64 to buffer
void u64_to_buf(uint8_t* buf, uint64_t value) {
    for (int i = 7; i >= 0; i--) {
        buf[i] = value & 0xFF;
        value >>= 8;
    }
}

// Check if transaction has CLAIM memo
int has_claim_memo() {
    uint8_t memos_buffer[1024];
    int memos_len = otxn_field(str_to_ptr(memos_buffer), sizeof(memos_buffer), sfMemos);

    if (memos_len <= 0) return 0;

    // Simple pattern search for "CLAIM"
    for (int i = 0; i < memos_len - 4; i++) {
        if (memos_buffer[i] == 'C' && memos_buffer[i+1] == 'L' &&
            memos_buffer[i+2] == 'A' && memos_buffer[i+3] == 'I' &&
            memos_buffer[i+4] == 'M') {
            return 1;
        }
    }
    return 0;
}

// Get parameter value
int get_param(void* out, int out_len, const char* name) {
    return hook_param(str_to_ptr(out), out_len, str_to_ptr(name), str_len(name));
}

// Check if sender is admin
int is_admin() {
    uint8_t admin_account[20];
    uint8_t sender[20];

    // Get admin from parameters
    if (get_param(admin_account, 20, "ADMIN") != 20) return 0;

    // Get transaction sender
    if (otxn_field(str_to_ptr(sender), 20, sfAccount) != 20) return 0;

    // Compare
    return mem_cmp(admin_account, sender, 20) == 0;
}

// Generate state key for account
void make_key(uint8_t* key, const uint8_t* account) {
    mem_set(key, 0, 32);

    // Prefix: "DRIPPY:CLAIM:"
    const char* prefix = "DRIPPY:CLAIM:";
    int prefix_len = str_len(prefix);
    mem_cpy(key, prefix, prefix_len);

    // Add account (20 bytes)
    mem_cpy(key + prefix_len, account, 20);
}

// Load account balance from state
uint64_t load_balance(const uint8_t* account) {
    uint8_t key[32];
    uint8_t balance_buf[8];

    make_key(key, account);

    int result = state(str_to_ptr(balance_buf), 8, str_to_ptr(key), 32);
    if (result == 8) {
        return buf_to_u64(balance_buf);
    }
    return 0; // No balance found
}

// Save account balance to state
int save_balance(const uint8_t* account, uint64_t balance) {
    uint8_t key[32];
    uint8_t balance_buf[8];

    make_key(key, account);
    u64_to_buf(balance_buf, balance);

    return state_set(str_to_ptr(balance_buf), 8, str_to_ptr(key), 32);
}

// Emit XRP payment
int emit_xrp_payment(const uint8_t* to_account, uint64_t drops) {
    uint8_t tx_blob[300];

    // Use the macro correctly
    int tx_len = PREPARE_PAYMENT_SIMPLE(tx_blob, drops, to_account, 0, 0);

    if (tx_len < 0) return -1;

    // Emit the transaction
    return emit(str_to_ptr(tx_blob), tx_len, str_to_ptr(""), 0);
}

// Process claim request
int process_claim() {
    uint8_t sender[20];

    // Get sender account
    if (otxn_field(str_to_ptr(sender), 20, sfAccount) != 20) {
        return rollback(str_to_ptr("invalid sender"), str_len("invalid sender"), 1);
    }

    // Load current balance
    uint64_t balance = load_balance(sender);

    if (balance == 0) {
        return rollback(str_to_ptr("no balance"), str_len("no balance"), 1);
    }

    // Get maximum claim amount (default 1000 XRP)
    uint8_t max_buf[8];
    uint64_t max_claim = 1000000000; // 1000 XRP in drops
    if (get_param(max_buf, 8, "MAXP") == 8) {
        max_claim = buf_to_u64(max_buf);
    }

    // Calculate payout (minimum of balance and max_claim)
    uint64_t payout = balance;
    if (max_claim > 0 && payout > max_claim) {
        payout = max_claim;
    }

    // Minimum claim check (default 1 XRP)
    uint64_t min_claim = 1000000; // 1 XRP in drops
    if (payout < min_claim) {
        return rollback(str_to_ptr("below minimum"), str_len("below minimum"), 1);
    }

    // Reserve transaction emission slot
    etxn_reserve(1);

    // Emit payment
    if (emit_xrp_payment(sender, payout) < 0) {
        return rollback(str_to_ptr("emit failed"), str_len("emit failed"), 1);
    }

    // Update balance
    uint64_t new_balance = balance - payout;
    if (save_balance(sender, new_balance) < 0) {
        return rollback(str_to_ptr("state failed"), str_len("state failed"), 1);
    }

    return accept(str_to_ptr("claimed"), str_len("claimed"), 0);
}

// Process admin deposit (add to user balance)
int process_admin_deposit() {
    uint8_t sender[20];
    uint8_t amount_buf[8];

    // Get sender account
    if (otxn_field(str_to_ptr(sender), 20, sfAccount) != 20) {
        return rollback(str_to_ptr("invalid sender"), str_len("invalid sender"), 1);
    }

    // Get payment amount
    if (otxn_field(str_to_ptr(amount_buf), 8, sfAmount) != 8) {
        return rollback(str_to_ptr("invalid amount"), str_len("invalid amount"), 1);
    }

    uint64_t deposit_amount = buf_to_u64(amount_buf);

    // Load current balance
    uint64_t current_balance = load_balance(sender);

    // Add deposit to balance
    uint64_t new_balance = current_balance + deposit_amount;

    // Save new balance
    if (save_balance(sender, new_balance) < 0) {
        return rollback(str_to_ptr("state failed"), str_len("state failed"), 1);
    }

    return accept(str_to_ptr("deposited"), str_len("deposited"), 0);
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only handle payments
    if (otxn_type() != ttPAYMENT) {
        return accept(str_to_ptr("not payment"), str_len("not payment"), 0);
    }

    // Get destination account
    uint8_t destination[20];
    uint8_t hook_acc[20];

    if (otxn_field(str_to_ptr(destination), 20, sfDestination) != 20) {
        return rollback(str_to_ptr("no destination"), str_len("no destination"), 1);
    }

    // Get our account
    hook_account(str_to_ptr(hook_acc), 20);

    // Check if payment is to us
    if (mem_cmp(destination, hook_acc, 20) != 0) {
        return accept(str_to_ptr("not for us"), str_len("not for us"), 0);
    }

    // Check for CLAIM memo
    if (has_claim_memo()) {
        return process_claim();
    }

    // Check if sender is admin (for deposits)
    if (is_admin()) {
        return process_admin_deposit();
    }

    // Regular payment - just accept
    return accept(str_to_ptr("payment ok"), str_len("payment ok"), 0);
}

// Callback function (required)
int64_t cbak(int64_t reserved) {
    return 0;
}