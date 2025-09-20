// DRIPPY Minimal Claim Hook - Fixed Guard Function
// Purpose: Basic reward claiming with correct guard implementation
// Triggers: Payments with "CLAIM" memo to this account

#include "hookapi.h"

// Required guard function for hooks - correct signature
void _g(uint32_t guard_id, uint32_t maxiter) {
    // Guard function implementation - empty is fine
}

// Convert pointer for API calls
uint32_t ptr_to_u32(const void* ptr) {
    return (uint32_t)(uintptr_t)ptr;
}

// Get string length manually
int get_str_len(const char* str) {
    int len = 0;
    while (str[len] != 0) len++;
    return len;
}

// Compare arrays manually
int arrays_equal(const uint8_t* a, const uint8_t* b, int len) {
    for (int i = 0; i < len; i++) {
        if (a[i] != b[i]) return 0;
    }
    return 1;
}

// Copy array manually
void copy_array(uint8_t* dest, const uint8_t* src, int len) {
    for (int i = 0; i < len; i++) {
        dest[i] = src[i];
    }
}

// Clear array manually
void clear_array(uint8_t* arr, int len) {
    for (int i = 0; i < len; i++) {
        arr[i] = 0;
    }
}

// Convert buffer to uint64
uint64_t bytes_to_uint64(const uint8_t* buf) {
    uint64_t result = 0;
    for (int i = 0; i < 8; i++) {
        result = (result << 8) | buf[i];
    }
    return result;
}

// Convert uint64 to buffer
void uint64_to_bytes(uint8_t* buf, uint64_t value) {
    for (int i = 7; i >= 0; i--) {
        buf[i] = value & 0xFF;
        value >>= 8;
    }
}

// Check if transaction has CLAIM memo
int has_claim_memo() {
    uint8_t memos_buffer[512];
    int memos_len = otxn_field(ptr_to_u32(memos_buffer), sizeof(memos_buffer), sfMemos);

    if (memos_len <= 0) return 0;

    // Look for "CLAIM" pattern
    for (int i = 0; i < memos_len - 4; i++) {
        if (memos_buffer[i] == 'C' && memos_buffer[i+1] == 'L' &&
            memos_buffer[i+2] == 'A' && memos_buffer[i+3] == 'I' &&
            memos_buffer[i+4] == 'M') {
            return 1;
        }
    }
    return 0;
}

// Get parameter from hook
int get_hook_param(uint8_t* out, int out_len, const char* name) {
    return hook_param(ptr_to_u32(out), out_len, ptr_to_u32(name), get_str_len(name));
}

// Check if sender is admin
int sender_is_admin() {
    uint8_t admin_account[20];
    uint8_t sender[20];

    // Get admin parameter
    if (get_hook_param(admin_account, 20, "ADMIN") != 20) return 0;

    // Get transaction sender
    if (otxn_field(ptr_to_u32(sender), 20, sfAccount) != 20) return 0;

    // Compare accounts
    return arrays_equal(admin_account, sender, 20);
}

// Generate state key for account
void create_state_key(uint8_t* key, const uint8_t* account) {
    clear_array(key, 32);

    // Prefix: "DRIPPY:"
    key[0] = 'D'; key[1] = 'R'; key[2] = 'I'; key[3] = 'P'; key[4] = 'P'; key[5] = 'Y'; key[6] = ':';

    // Add account (first 20 bytes starting at position 7)
    copy_array(key + 7, account, 20);
}

// Load user balance from state
uint64_t get_user_balance(const uint8_t* account) {
    uint8_t key[32];
    uint8_t balance_data[8];

    create_state_key(key, account);

    int result = state(ptr_to_u32(balance_data), 8, ptr_to_u32(key), 32);
    if (result == 8) {
        return bytes_to_uint64(balance_data);
    }
    return 0; // No balance
}

// Save user balance to state
int set_user_balance(const uint8_t* account, uint64_t balance) {
    uint8_t key[32];
    uint8_t balance_data[8];

    create_state_key(key, account);
    uint64_to_bytes(balance_data, balance);

    return state_set(ptr_to_u32(balance_data), 8, ptr_to_u32(key), 32);
}

// Process claim request
int handle_claim() {
    uint8_t sender[20];

    // Get sender account
    if (otxn_field(ptr_to_u32(sender), 20, sfAccount) != 20) {
        return rollback(ptr_to_u32("bad sender"), get_str_len("bad sender"), 1);
    }

    // Get current balance
    uint64_t balance = get_user_balance(sender);

    if (balance == 0) {
        return rollback(ptr_to_u32("no balance"), get_str_len("no balance"), 2);
    }

    // Get max claim parameter (optional)
    uint8_t max_buf[8];
    uint64_t max_claim = 0;
    if (get_hook_param(max_buf, 8, "MAXP") == 8) {
        max_claim = bytes_to_uint64(max_buf);
    }

    // Calculate payout
    uint64_t payout = balance;
    if (max_claim > 0 && payout > max_claim) {
        payout = max_claim;
    }

    // Check minimum (1 XRP = 1,000,000 drops)
    if (payout < 1000000) {
        return rollback(ptr_to_u32("too small"), get_str_len("too small"), 3);
    }

    // Mark as claimed by reducing balance
    uint64_t new_balance = balance - payout;
    if (set_user_balance(sender, new_balance) < 0) {
        return rollback(ptr_to_u32("state error"), get_str_len("state error"), 4);
    }

    return accept(ptr_to_u32("claimed"), get_str_len("claimed"), 0);
}

// Process admin adding balance
int handle_admin_add() {
    uint8_t sender[20];
    uint8_t amount_data[8];

    // Get sender
    if (otxn_field(ptr_to_u32(sender), 20, sfAccount) != 20) {
        return rollback(ptr_to_u32("bad sender"), get_str_len("bad sender"), 1);
    }

    // Get payment amount
    if (otxn_field(ptr_to_u32(amount_data), 8, sfAmount) != 8) {
        return rollback(ptr_to_u32("bad amount"), get_str_len("bad amount"), 2);
    }

    uint64_t add_amount = bytes_to_uint64(amount_data);
    uint64_t current_balance = get_user_balance(sender);
    uint64_t new_balance = current_balance + add_amount;

    if (set_user_balance(sender, new_balance) < 0) {
        return rollback(ptr_to_u32("state error"), get_str_len("state error"), 3);
    }

    return accept(ptr_to_u32("added"), get_str_len("added"), 0);
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only handle payments
    if (otxn_type() != ttPAYMENT) {
        return accept(ptr_to_u32("not payment"), get_str_len("not payment"), 0);
    }

    // Check if payment is to our account
    uint8_t destination[20];
    uint8_t our_account[20];

    if (otxn_field(ptr_to_u32(destination), 20, sfDestination) != 20) {
        return rollback(ptr_to_u32("no dest"), get_str_len("no dest"), 1);
    }

    hook_account(ptr_to_u32(our_account), 20);

    if (!arrays_equal(destination, our_account, 20)) {
        return accept(ptr_to_u32("not for us"), get_str_len("not for us"), 0);
    }

    // Check for CLAIM memo
    if (has_claim_memo()) {
        return handle_claim();
    }

    // Check if admin is adding balance
    if (sender_is_admin()) {
        return handle_admin_add();
    }

    // Regular payment, just accept
    return accept(ptr_to_u32("ok"), get_str_len("ok"), 0);
}

// Required callback function
int64_t cbak(int64_t reserved) {
    return 0;
}