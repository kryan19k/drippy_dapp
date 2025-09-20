// DRIPPY Enhanced Claim Hook - Reward Distribution System (Web Compatible)
// Purpose: Allow users to claim accumulated rewards with advanced features
// Triggers: Payments with specific memos to the claim pool account
//
// Supported Operations:
//   "CLAIM"     : User claims their accumulated rewards
//   "ACC_A"+"ACC_V" : Admin adds accrual for account (requires ADMIN auth)
//   "BOOST"     : Admin sets NFT boost multiplier for account
//
// HookParameters (hex values):
//   ADMIN     : 20-byte admin account id (required for admin operations)
//   CUR       : 20-byte currency code for IOU payouts (optional)
//   ISSUER    : 20-byte issuer account for IOU payouts (optional)
//   MAXP      : 8-byte u64 max drops per claim (0 = unlimited)
//   COOLD     : 8-byte u64 cooldown seconds between claims (0 = none)
//   DAILY_MAX : 8-byte u64 max daily claims per account (0 = unlimited)
//   MIN_CLAIM : 8-byte u64 minimum claimable amount (default 1000000 = 1 XRP)
//   BOOST_MAX : 4-byte u32 maximum boost multiplier (default 500 = 5x)

#include "hookapi.h"

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

// Error messages
static const char* ERR_NO_ACCRUAL = "no accrual";
static const char* ERR_COOLDOWN = "cooldown active";
static const char* ERR_DAILY_LIMIT = "daily limit exceeded";
static const char* ERR_MIN_AMOUNT = "below minimum";
static const char* ERR_ADMIN_ONLY = "admin required";
static const char* ERR_EMIT_FAILED = "emit failed";
static const char* ERR_STATE_FAILED = "state update failed";
static const char* ERR_INVALID_ACCOUNT = "invalid account";
static const char* ERR_INVALID_AMOUNT = "invalid amount";

// Utility functions
static int memo_has_type(uint32_t memo_slot, const char* type) {
    uint32_t type_slot = slot_subfield(memo_slot, sfMemoType, 0);
    if (type_slot == DOESNT_EXIST) return 0;

    uint8_t buf[32];
    int64_t len = slot(SBUF(buf), type_slot);
    if (len <= 0 || len != strlen(type)) return 0;

    for (int i = 0; i < len; ++i) {
        if (buf[i] != (uint8_t)type[i]) return 0;
    }
    return 1;
}

static int read_memo_data(uint32_t memo_slot, uint8_t* out, int64_t max) {
    uint32_t data_slot = slot_subfield(memo_slot, sfMemoData, 0);
    if (data_slot == DOESNT_EXIST) return DOESNT_EXIST;
    return slot(out, max, data_slot);
}

static uint64_t read_param_u64(const char* name, uint64_t default_val) {
    uint8_t buf[8];
    if (hook_param(SBUF(buf), (uint8_t*)name, strlen(name)) == 8) {
        return UINT64_FROM_BUF(buf);
    }
    return default_val;
}

static uint32_t read_param_u32(const char* name, uint32_t default_val) {
    uint8_t buf[4];
    if (hook_param(SBUF(buf), (uint8_t*)name, strlen(name)) == 4) {
        return UINT32_FROM_BUF(buf);
    }
    return default_val;
}

static int read_param_account(const char* name, uint8_t account[20]) {
    return hook_param(account, 20, (uint8_t*)name, strlen(name)) == 20;
}

// State key: DRIPPY:CLAIM:v2 + 20-byte account ID
static void make_state_key(uint8_t key[KEYLEN], const uint8_t* acct20) {
    // Enhanced namespace for v2
    uint8_t prefix[12] = {'D','R','I','P','P','Y',':','C','L','A','I','M','2'};
    memcpy(key, prefix, 12);
    memcpy(key + 12, acct20, 20);
}

// Read account state with full structure
static int read_account_state(const uint8_t* account, uint8_t state[STATE_SIZE]) {
    uint8_t key[KEYLEN];
    make_state_key(key, account);

    int result = state(state, STATE_SIZE, key, KEYLEN);
    if (result < 0) {
        // Initialize empty state
        memset(state, 0, STATE_SIZE);
        return 0;
    }
    return result;
}

// Write account state
static int write_account_state(const uint8_t* account, const uint8_t state[STATE_SIZE]) {
    uint8_t key[KEYLEN];
    make_state_key(key, account);
    return state_set(state, STATE_SIZE, key, KEYLEN);
}

// Get current day (for daily limits)
static uint32_t get_current_day() {
    return (uint32_t)(ledger_time() / SECONDS_PER_DAY);
}

// Check if we need to reset daily counter
static void check_daily_reset(uint8_t state[STATE_SIZE]) {
    static uint32_t last_reset_day = 0;
    uint32_t current_day = get_current_day();

    if (last_reset_day != current_day) {
        // Reset daily claimed amount
        UINT64_TO_BUF(state + OFFSET_DAILY_CLAIMED, 0);
        last_reset_day = current_day;
    }
}

// Validate account ID format
static int is_valid_account(const uint8_t* account) {
    // Basic validation - account should not be all zeros
    for (int i = 0; i < 20; i++) {
        if (account[i] != 0) return 1;
    }
    return 0;
}

// Check admin authorization
static int is_admin_authorized() {
    uint8_t admin_account[20];
    if (!read_param_account("ADMIN", admin_account)) return 0;

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);

    return memcmp(admin_account, sender, 20) == 0;
}

// Emit reward payment using macro
static int emit_reward_payment(const uint8_t* recipient, uint64_t amount) {
    if (amount == 0) return 1;  // Nothing to emit

    etxn_reserve(1);

    // Check if we should pay in IOU
    uint8_t currency[20], issuer[20];
    int has_currency = read_param_account("CUR", currency);
    int has_issuer = read_param_account("ISSUER", issuer);

    uint8_t tx[PREPARE_PAYMENT_SIMPLE_SIZE];

    if (has_currency && has_issuer) {
        // IOU payment - use trustline payment macro
        PREPARE_PAYMENT_SIMPLE_TRUSTLINE(tx, amount, recipient, currency, issuer, 0, 0);
    } else {
        // XRP payment
        PREPARE_PAYMENT_SIMPLE(tx, amount, recipient, 0, 0);
    }

    int64_t result = emit(SBUF(tx));
    return result >= 0;
}

// Process claim operation
static int process_claim(const uint8_t* claimant) {
    uint8_t account_state[STATE_SIZE];
    if (read_account_state(claimant, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    // Check daily reset
    check_daily_reset(account_state);

    // Extract state values
    uint64_t accrued = UINT64_FROM_BUF(account_state + OFFSET_ACCRUED);
    uint64_t last_claim = UINT64_FROM_BUF(account_state + OFFSET_LAST_CLAIM);
    uint32_t claim_count = UINT32_FROM_BUF(account_state + OFFSET_CLAIM_COUNT);
    uint32_t boost_mult = UINT32_FROM_BUF(account_state + OFFSET_BOOST_MULT);
    uint64_t daily_claimed = UINT64_FROM_BUF(account_state + OFFSET_DAILY_CLAIMED);

    // Set default boost if not set
    if (boost_mult == 0) boost_mult = 100;  // 1x default

    // Check minimum claimable amount
    uint64_t min_claim = read_param_u64("MIN_CLAIM", DEFAULT_MIN_CLAIM);
    if (accrued < min_claim) {
        return rollback(SBUF(ERR_MIN_AMOUNT), 1);
    }

    // Check cooldown
    uint64_t cooldown = read_param_u64("COOLD", 0);
    if (cooldown > 0) {
        uint64_t now = (uint64_t)ledger_time();
        if (last_claim && (now < last_claim + cooldown)) {
            return rollback(SBUF(ERR_COOLDOWN), 1);
        }
    }

    // Calculate payout amount
    uint64_t max_claim = read_param_u64("MAXP", 0);
    uint64_t daily_max = read_param_u64("DAILY_MAX", 0);

    uint64_t payout = accrued;

    // Apply per-claim limit
    if (max_claim > 0 && payout > max_claim) {
        payout = max_claim;
    }

    // Apply daily limit
    if (daily_max > 0) {
        uint64_t daily_remaining = daily_max > daily_claimed ? daily_max - daily_claimed : 0;
        if (payout > daily_remaining) {
            payout = daily_remaining;
        }
    }

    if (payout == 0) {
        return rollback(SBUF(ERR_DAILY_LIMIT), 1);
    }

    // Apply NFT boost to payout (not to accrued balance)
    uint64_t boosted_payout = (payout * boost_mult) / 100;

    // Emit payment
    if (!emit_reward_payment(claimant, boosted_payout)) {
        return rollback(SBUF(ERR_EMIT_FAILED), 1);
    }

    // Update state
    uint64_t remaining = accrued - payout;
    uint64_t now = (uint64_t)ledger_time();

    UINT64_TO_BUF(account_state + OFFSET_ACCRUED, remaining);
    UINT64_TO_BUF(account_state + OFFSET_LAST_CLAIM, now);
    UINT32_TO_BUF(account_state + OFFSET_CLAIM_COUNT, claim_count + 1);
    UINT64_TO_BUF(account_state + OFFSET_DAILY_CLAIMED, daily_claimed + payout);

    if (write_account_state(claimant, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    return accept(SBUF("claimed"), 0);
}

// Process admin accrual addition
static int process_accrual(const uint8_t* target_account, uint64_t add_amount) {
    if (!is_admin_authorized()) {
        return rollback(SBUF(ERR_ADMIN_ONLY), 1);
    }

    if (!is_valid_account(target_account)) {
        return rollback(SBUF(ERR_INVALID_ACCOUNT), 1);
    }

    if (add_amount == 0) {
        return rollback(SBUF(ERR_INVALID_AMOUNT), 1);
    }

    uint8_t account_state[STATE_SIZE];
    if (read_account_state(target_account, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    // Update accrued amount
    uint64_t current_accrued = UINT64_FROM_BUF(account_state + OFFSET_ACCRUED);
    uint64_t new_accrued = current_accrued + add_amount;

    UINT64_TO_BUF(account_state + OFFSET_ACCRUED, new_accrued);

    if (write_account_state(target_account, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    return accept(SBUF("accrual added"), 0);
}

// Process boost multiplier setting
static int process_boost(const uint8_t* target_account, uint32_t boost_multiplier) {
    if (!is_admin_authorized()) {
        return rollback(SBUF(ERR_ADMIN_ONLY), 1);
    }

    if (!is_valid_account(target_account)) {
        return rollback(SBUF(ERR_INVALID_ACCOUNT), 1);
    }

    uint32_t max_boost = read_param_u32("BOOST_MAX", DEFAULT_BOOST_MAX);
    if (boost_multiplier > max_boost) {
        boost_multiplier = max_boost;
    }

    uint8_t account_state[STATE_SIZE];
    if (read_account_state(target_account, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    UINT32_TO_BUF(account_state + OFFSET_BOOST_MULT, boost_multiplier);

    if (write_account_state(target_account, account_state) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    return accept(SBUF("boost updated"), 0);
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only process Payments
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Get transaction source
    uint8_t source[20];
    otxn_field(SBUF(source), sfAccount);

    // Parse memos to determine operation
    uint32_t memos_slot = otxn_field_slot(sfMemos, 0);
    if (memos_slot == DOESNT_EXIST) return accept(0,0,0);

    // Operation variables
    enum { OP_NONE, OP_CLAIM, OP_ACCRUAL, OP_BOOST, OP_INFO } operation = OP_NONE;
    uint8_t target_account[20];
    uint64_t amount_value = 0;
    uint32_t boost_value = 0;

    // Parse memo operations
    for (int i = 0; ; ++i) {
        uint32_t memo_arr = slot_subarray(memos_slot, i);
        if (memo_arr == DOESNT_EXIST) break;

        uint32_t memo_obj = slot_subfield(memo_arr, sfMemo, 0);
        if (memo_obj == DOESNT_EXIST) continue;

        if (memo_has_type(memo_obj, "CLAIM")) {
            operation = OP_CLAIM;
            memcpy(target_account, source, 20);  // Claimant is sender
        }
        else if (memo_has_type(memo_obj, "ACC_A")) {
            // Account hex in memo data
            uint8_t acc_hex[40];
            int len = read_memo_data(memo_obj, acc_hex, 40);
            if (len == 40) {
                if (unhexlify(target_account, 20, acc_hex, 40) == 20) {
                    operation = OP_ACCRUAL;
                }
            }
        }
        else if (memo_has_type(memo_obj, "ACC_V")) {
            // Amount hex in memo data
            uint8_t amt_hex[16];
            int len = read_memo_data(memo_obj, amt_hex, 16);
            if (len > 0 && len <= 16) {
                uint8_t amt_buf[8] = {0};
                int bytes = (len + 1) / 2;
                if (unhexlify(amt_buf + (8 - bytes), amt_hex, len) == bytes) {
                    amount_value = UINT64_FROM_BUF(amt_buf);
                }
            }
        }
        else if (memo_has_type(memo_obj, "BOOST")) {
            // Boost multiplier as hex
            uint8_t boost_hex[8];
            int len = read_memo_data(memo_obj, boost_hex, 8);
            if (len > 0 && len <= 8) {
                uint8_t boost_buf[4] = {0};
                int bytes = (len + 1) / 2;
                if (unhexlify(boost_buf + (4 - bytes), boost_hex, len) == bytes) {
                    boost_value = UINT32_FROM_BUF(boost_buf);
                    operation = OP_BOOST;
                }
            }
        }
    }

    // Execute operation
    switch (operation) {
        case OP_CLAIM:
            return process_claim(target_account);

        case OP_ACCRUAL:
            if (amount_value > 0) {
                return process_accrual(target_account, amount_value);
            }
            break;

        case OP_BOOST:
            return process_boost(target_account, boost_value);

        case OP_INFO:
            // Read-only operation, just return state info
            return accept(SBUF("info"), 0);

        default:
            break;
    }

    return accept(0,0,0);
}

// Callback function (required but unused)
int64_t cbak(int64_t reserved) {
    return 0;
}