// DRIPPY Enhanced Claim Hook - Reward Distribution System (Fixed for Hooks Builder)
// Purpose: Allow users to claim accumulated rewards with advanced features
// Triggers: Payments with specific memos to the claim pool account

#include "hookapi.h"
#include <stdint.h>

#define KEYLEN 32
#define STATE_SIZE 32

// State offsets
#define OFFSET_ACCRUED 0
#define OFFSET_LAST_CLAIM 8
#define OFFSET_CLAIM_COUNT 16
#define OFFSET_BOOST_MULT 20
#define OFFSET_DAILY_CLAIMED 24

// Default values
#define DEFAULT_MIN_CLAIM 1000000  // 1 XRP in drops
#define DEFAULT_BOOST_MAX 500      // 5x maximum boost
#define SECONDS_PER_DAY 86400

// Helper function to get memo data
int get_memo_data(uint32_t memo_slot, uint8_t* out, int max_len) {
    return slot(out, max_len, memo_slot);
}

// Helper function to convert buffer to uint64
uint64_t buf_to_uint64(uint8_t* buf) {
    uint64_t result = 0;
    for (int i = 0; i < 8; i++) {
        result = (result << 8) | buf[i];
    }
    return result;
}

// Helper function to convert uint64 to buffer
void uint64_to_buf(uint8_t* buf, uint64_t value) {
    for (int i = 7; i >= 0; i--) {
        buf[i] = value & 0xFF;
        value >>= 8;
    }
}

// Helper function to convert buffer to uint32
uint32_t buf_to_uint32(uint8_t* buf) {
    uint32_t result = 0;
    for (int i = 0; i < 4; i++) {
        result = (result << 8) | buf[i];
    }
    return result;
}

// Helper function to convert uint32 to buffer
void uint32_to_buf(uint8_t* buf, uint32_t value) {
    for (int i = 3; i >= 0; i--) {
        buf[i] = value & 0xFF;
        value >>= 8;
    }
}

// Helper function to get parameter as uint64
uint64_t get_param_u64(const char* name) {
    uint8_t buf[8];
    int name_len = 0;
    while (name[name_len] != 0) name_len++; // Manual strlen

    if (hook_param(buf, 8, name, name_len) == 8) {
        return buf_to_uint64(buf);
    }
    return 0;
}

// Helper function to get parameter as uint32
uint32_t get_param_u32(const char* name) {
    uint8_t buf[4];
    int name_len = 0;
    while (name[name_len] != 0) name_len++; // Manual strlen

    if (hook_param(buf, 4, name, name_len) == 4) {
        return buf_to_uint32(buf);
    }
    return 0;
}

// Helper function to get parameter as account
int get_param_account(uint8_t* account, const char* name) {
    int name_len = 0;
    while (name[name_len] != 0) name_len++; // Manual strlen
    return hook_param(account, 20, name, name_len) == 20;
}

// Generate state key for account
void make_account_key(uint8_t* key, uint8_t* account) {
    // Clear key
    for (int i = 0; i < KEYLEN; i++) key[i] = 0;

    // Add prefix "DRIPPY:CLAIM:"
    uint8_t prefix[12] = {'D','R','I','P','P','Y',':','C','L','A','I','M',':'};
    for (int i = 0; i < 12; i++) key[i] = prefix[i];

    // Add account id
    for (int i = 0; i < 20; i++) key[12 + i] = account[i];
}

// Load account state
int load_account_state(uint8_t* state, uint8_t* account) {
    uint8_t key[KEYLEN];
    make_account_key(key, account);

    int result = state_get(state, STATE_SIZE, key, KEYLEN);
    if (result < 0) {
        // Initialize empty state
        for (int i = 0; i < STATE_SIZE; i++) state[i] = 0;
        return 0;
    }
    return result;
}

// Save account state
int save_account_state(const uint8_t* state, uint8_t* account) {
    uint8_t key[KEYLEN];
    make_account_key(key, account);
    return state_set(state, STATE_SIZE, key, KEYLEN);
}

// Get current day (for daily limits)
uint32_t get_current_day() {
    return (uint32_t)(ledger_last_time() / SECONDS_PER_DAY);
}

// Check if account is admin
int is_admin(uint8_t* sender) {
    uint8_t admin_account[20];
    if (!get_param_account(admin_account, "ADMIN")) {
        return 0; // No admin configured
    }

    // Compare accounts
    for (int i = 0; i < 20; i++) {
        if (admin_account[i] != sender[i]) return 0;
    }
    return 1;
}

// Emit payment transaction
int emit_payment(uint8_t* recipient, uint64_t amount) {
    uint8_t currency[20];
    uint8_t issuer[20];
    int has_currency = get_param_account(currency, "CUR");
    int has_issuer = get_param_account(issuer, "ISSUER");

    if (has_currency && has_issuer) {
        // IOU payment - simplified for this version
        // In production, implement proper IOU payment construction
        return -1; // Not implemented in this simplified version
    } else {
        // XRP payment
        uint8_t tx[248];
        int tx_len = PREPARE_PAYMENT_SIMPLE(tx, amount, recipient, 0, 0);

        if (tx_len < 0) return tx_len;

        return emit(tx, tx_len);
    }
}

// Process claim request
int process_claim(uint8_t* claimant) {
    uint8_t state[STATE_SIZE];
    if (load_account_state(state, claimant) < 0) {
        return rollback("state load failed", 1);
    }

    // Extract state data
    uint64_t accrued = buf_to_uint64(state + OFFSET_ACCRUED);
    uint64_t last_claim = buf_to_uint64(state + OFFSET_LAST_CLAIM);
    uint32_t claim_count = buf_to_uint32(state + OFFSET_CLAIM_COUNT);
    uint32_t boost_mult = buf_to_uint32(state + OFFSET_BOOST_MULT);
    uint64_t daily_claimed = buf_to_uint64(state + OFFSET_DAILY_CLAIMED);

    // Check if there's anything to claim
    if (accrued == 0) {
        return rollback("no accrual", 1);
    }

    // Get parameters
    uint64_t cooldown = get_param_u64("COOLD");
    uint64_t max_per_claim = get_param_u64("MAXP");
    uint64_t daily_max = get_param_u64("DAILY_MAX");
    uint64_t min_claim = get_param_u64("MIN_CLAIM");
    if (min_claim == 0) min_claim = DEFAULT_MIN_CLAIM;

    // Check cooldown
    if (cooldown > 0) {
        uint64_t now = (uint64_t)ledger_last_time();
        if (now < last_claim + cooldown) {
            return rollback("cooldown active", 1);
        }
    }

    // Check daily limits
    uint32_t current_day = get_current_day();
    uint32_t last_claim_day = (uint32_t)(last_claim / SECONDS_PER_DAY);

    if (current_day != last_claim_day) {
        daily_claimed = 0; // Reset daily counter
    }

    // Calculate payout amount
    uint64_t payout = accrued;

    // Apply boost multiplier
    if (boost_mult > 100) {
        payout = (payout * boost_mult) / 100;
    }

    // Apply per-claim limit
    if (max_per_claim > 0 && payout > max_per_claim) {
        payout = max_per_claim;
    }

    // Check minimum claim
    if (payout < min_claim) {
        return rollback("below minimum", 1);
    }

    // Check daily limit
    if (daily_max > 0 && daily_claimed + payout > daily_max) {
        return rollback("daily limit exceeded", 1);
    }

    // Emit payment
    etxn_reserve(1);
    int64_t emit_result = emit_payment(claimant, payout);
    if (emit_result < 0) {
        return rollback("emit failed", 1);
    }

    // Update state
    uint64_t now = (uint64_t)ledger_last_time();
    uint64_to_buf(state + OFFSET_ACCRUED, accrued - payout);
    uint64_to_buf(state + OFFSET_LAST_CLAIM, now);
    uint32_to_buf(state + OFFSET_CLAIM_COUNT, claim_count + 1);
    uint64_to_buf(state + OFFSET_DAILY_CLAIMED, daily_claimed + payout);

    if (save_account_state(state, claimant) < 0) {
        return rollback("state update failed", 1);
    }

    return accept("claimed", 0);
}

// Process admin accrual
int process_admin_accrual(uint8_t* target_account, uint64_t amount) {
    uint8_t state[STATE_SIZE];
    if (load_account_state(state, target_account) < 0) {
        return rollback("state load failed", 1);
    }

    uint64_t current_accrued = buf_to_uint64(state + OFFSET_ACCRUED);
    uint64_to_buf(state + OFFSET_ACCRUED, current_accrued + amount);

    if (save_account_state(state, target_account) < 0) {
        return rollback("state update failed", 1);
    }

    return accept("accrual added", 0);
}

// Process admin boost setting
int process_admin_boost(uint8_t* target_account, uint32_t boost_multiplier) {
    uint32_t boost_max = get_param_u32("BOOST_MAX");
    if (boost_max == 0) boost_max = DEFAULT_BOOST_MAX;

    if (boost_multiplier > boost_max) {
        return rollback("boost too high", 1);
    }

    uint8_t state[STATE_SIZE];
    if (load_account_state(state, target_account) < 0) {
        return rollback("state load failed", 1);
    }

    uint32_to_buf(state + OFFSET_BOOST_MULT, boost_multiplier);

    if (save_account_state(state, target_account) < 0) {
        return rollback("state update failed", 1);
    }

    return accept("boost set", 0);
}

// Parse memo for commands
int parse_memo() {
    // Get memo field
    uint8_t memos_raw[2048];
    int memos_len = otxn_field(memos_raw, sizeof(memos_raw), sfMemos);
    if (memos_len <= 0) return 0;

    // For simplicity, look for specific patterns in the memo data
    // In production, implement proper TLV parsing

    // Look for "CLAIM" pattern
    for (int i = 0; i < memos_len - 4; i++) {
        if (memos_raw[i] == 'C' && memos_raw[i+1] == 'L' &&
            memos_raw[i+2] == 'A' && memos_raw[i+3] == 'I' &&
            memos_raw[i+4] == 'M') {
            return 1; // CLAIM command
        }
    }

    return 0;
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only process payments
    if (otxn_type() != ttPAYMENT) {
        return accept("not payment", 0);
    }

    // Get transaction accounts
    uint8_t sender[20];
    uint8_t destination[20];

    if (otxn_field(sender, 20, sfAccount) != 20) {
        return rollback("invalid sender", 1);
    }

    if (otxn_field(destination, 20, sfDestination) != 20) {
        return rollback("invalid destination", 1);
    }

    // Check if this payment is to us
    uint8_t hook_acc[20];
    hook_account(hook_acc, 20);

    int is_to_us = 1;
    for (int i = 0; i < 20; i++) {
        if (destination[i] != hook_acc[i]) {
            is_to_us = 0;
            break;
        }
    }

    if (!is_to_us) {
        return accept("not for us", 0);
    }

    // Parse memo for command
    if (parse_memo()) {
        // This is a claim request
        return process_claim(sender);
    }

    // Check if sender is admin for admin operations
    if (is_admin(sender)) {
        // For admin operations, you would parse more specific memos
        // For now, just accept admin payments
        return accept("admin payment", 0);
    }

    // Regular payment, just accept
    return accept("payment accepted", 0);
}

// Callback function (required but unused)
int64_t cbak(int64_t reserved) {
    return 0;
}