// DRIPPY Fee Router Hook - Automated Revenue Distribution (Web Compatible)
// Purpose: Automatically route incoming protocol fees to reward pools
// Triggers: Payments to the treasury/issuer account
//
// HookParameters (hex values):
//   ADMIN     : 20-byte admin account id (for parameter updates)
//   NFT_ALLOC : 4-byte u32 percentage (default: 40)
//   HOLD_ALLOC: 4-byte u32 percentage (default: 30)
//   TREA_ALLOC: 4-byte u32 percentage (default: 20)
//   AMM_ALLOC : 4-byte u32 percentage (default: 10)
//   NFT_POOL  : 20-byte NFT reward pool account
//   HOLD_POOL : 20-byte holder reward pool account
//   TREA_POOL : 20-byte treasury pool account
//   AMM_POOL  : 20-byte AMM pool account
//   MIN_AMOUNT: 8-byte u64 minimum amount to trigger routing (drops)
//   ANTI_SNIPE: 8-byte u64 anti-sniping end epoch (0 = disabled)
//   FEE_BPS   : 4-byte u32 fee in basis points (100 = 1%)

#include "hookapi.h"

#define KEYLEN 32
#define MAX_POOLS 4

// State key prefixes
static const char* STATE_PREFIX = "DRIPPY:ROUTER:v1";

// Default allocations (can be overridden by parameters)
#define DEFAULT_NFT_ALLOC 40
#define DEFAULT_HOLD_ALLOC 30
#define DEFAULT_TREA_ALLOC 20
#define DEFAULT_AMM_ALLOC 10
#define DEFAULT_FEE_BPS 100  // 1%

// Error messages
static const char* ERR_INSUFFICIENT = "amount too small";
static const char* ERR_ANTI_SNIPE = "anti-sniping active";
static const char* ERR_INVALID_ALLOC = "invalid allocation";
static const char* ERR_EMIT_FAILED = "emit failed";
static const char* ERR_STATE_FAILED = "state update failed";

// Utility function: read parameter with default
static uint32_t read_param_u32(const char* name, uint32_t default_val) {
    uint8_t buf[4];
    if (hook_param(SBUF(buf), (uint8_t*)name, strlen(name)) == 4) {
        return UINT32_FROM_BUF(buf);
    }
    return default_val;
}

static uint64_t read_param_u64(const char* name, uint64_t default_val) {
    uint8_t buf[8];
    if (hook_param(SBUF(buf), (uint8_t*)name, strlen(name)) == 8) {
        return UINT64_FROM_BUF(buf);
    }
    return default_val;
}

static int read_param_account(const char* name, uint8_t account[20]) {
    return hook_param(account, 20, (uint8_t*)name, strlen(name)) == 20;
}

// State management functions
static void make_state_key(uint8_t key[KEYLEN], const char* suffix) {
    // Prefix: "DRIPPY:ROUTER:v1:" + suffix (padded to 32 bytes)
    memset(key, 0, KEYLEN);
    int prefix_len = strlen(STATE_PREFIX);
    memcpy(key, STATE_PREFIX, prefix_len);
    key[prefix_len] = ':';

    int suffix_len = strlen(suffix);
    int max_suffix = KEYLEN - prefix_len - 1;
    if (suffix_len > max_suffix) suffix_len = max_suffix;
    memcpy(key + prefix_len + 1, suffix, suffix_len);
}

static uint64_t get_state_u64(const char* key_suffix) {
    uint8_t key[KEYLEN];
    make_state_key(key, key_suffix);

    uint8_t buf[8];
    if (state(SBUF(buf), key, KEYLEN) == 8) {
        return UINT64_FROM_BUF(buf);
    }
    return 0;
}

static int set_state_u64(const char* key_suffix, uint64_t value) {
    uint8_t key[KEYLEN];
    make_state_key(key, key_suffix);

    uint8_t buf[8];
    UINT64_TO_BUF(buf, value);

    return state_set(SBUF(buf), key, KEYLEN);
}

// Anti-sniping check
static int is_anti_sniping_active() {
    uint64_t anti_snipe_end = read_param_u64("ANTI_SNIPE", 0);
    if (anti_snipe_end == 0) return 0;  // Disabled

    uint64_t now = (uint64_t)ledger_time();
    return now < anti_snipe_end;
}

// Check if transaction should be blocked during anti-sniping
static int should_block_transaction() {
    if (!is_anti_sniping_active()) return 0;

    // Get transaction details for anti-sniping analysis
    uint8_t source[20];
    otxn_field(SBUF(source), sfAccount);

    // TODO: Add more sophisticated anti-sniping logic
    // For now, just check if it's during anti-snipe period
    // Could add: whitelist checking, transaction pattern analysis, etc.

    return 0;  // Allow transaction for now
}

// Validate allocation percentages
static int validate_allocations(uint32_t nft, uint32_t hold, uint32_t trea, uint32_t amm) {
    return (nft + hold + trea + amm) == 100;
}

// Emit payment to specific pool using macro
static int emit_pool_payment(const uint8_t pool_account[20], uint64_t amount) {
    if (amount == 0) return 0;  // Skip zero amounts

    etxn_reserve(1);

    uint8_t tx[PREPARE_PAYMENT_SIMPLE_SIZE];
    PREPARE_PAYMENT_SIMPLE(tx, amount, pool_account, 0, 0);

    int64_t result = emit(SBUF(tx));
    return result >= 0;
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only process incoming payments
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Get payment amount (in drops)
    uint64_t amount = 0;
    uint8_t amount_buf[8];
    if (otxn_field(SBUF(amount_buf), sfAmount) == 8) {
        amount = UINT64_FROM_BUF(amount_buf);
    } else {
        // Handle IOU amounts (more complex)
        return accept(0,0,0);  // Skip IOU for now
    }

    // Check minimum amount threshold
    uint64_t min_amount = read_param_u64("MIN_AMOUNT", 1000000);  // Default 1 XRP
    if (amount < min_amount) {
        return accept(SBUF(ERR_INSUFFICIENT), 0);
    }

    // Anti-sniping protection
    if (should_block_transaction()) {
        return rollback(SBUF(ERR_ANTI_SNIPE), 1);
    }

    // Read allocation parameters
    uint32_t nft_alloc = read_param_u32("NFT_ALLOC", DEFAULT_NFT_ALLOC);
    uint32_t hold_alloc = read_param_u32("HOLD_ALLOC", DEFAULT_HOLD_ALLOC);
    uint32_t trea_alloc = read_param_u32("TREA_ALLOC", DEFAULT_TREA_ALLOC);
    uint32_t amm_alloc = read_param_u32("AMM_ALLOC", DEFAULT_AMM_ALLOC);

    // Validate allocations sum to 100%
    if (!validate_allocations(nft_alloc, hold_alloc, trea_alloc, amm_alloc)) {
        return rollback(SBUF(ERR_INVALID_ALLOC), 1);
    }

    // Read pool account addresses
    uint8_t nft_pool[20], hold_pool[20], trea_pool[20], amm_pool[20];

    if (!read_param_account("NFT_POOL", nft_pool) ||
        !read_param_account("HOLD_POOL", hold_pool) ||
        !read_param_account("TREA_POOL", trea_pool) ||
        !read_param_account("AMM_POOL", amm_pool)) {
        return rollback(SBUF("missing pool accounts"), 1);
    }

    // Calculate distribution amounts
    uint64_t nft_amount = (amount * nft_alloc) / 100;
    uint64_t hold_amount = (amount * hold_alloc) / 100;
    uint64_t trea_amount = (amount * trea_alloc) / 100;
    uint64_t amm_amount = amount - nft_amount - hold_amount - trea_amount;  // Remainder to AMM

    // Emit payments to each pool
    if (!emit_pool_payment(nft_pool, nft_amount)) {
        return rollback(SBUF(ERR_EMIT_FAILED), 1);
    }

    if (!emit_pool_payment(hold_pool, hold_amount)) {
        return rollback(SBUF(ERR_EMIT_FAILED), 1);
    }

    if (!emit_pool_payment(trea_pool, trea_amount)) {
        return rollback(SBUF(ERR_EMIT_FAILED), 1);
    }

    if (!emit_pool_payment(amm_pool, amm_amount)) {
        return rollback(SBUF(ERR_EMIT_FAILED), 1);
    }

    // Update state tracking
    uint64_t total_distributed = get_state_u64("TOTAL_DIST") + amount;
    uint64_t nft_total = get_state_u64("NFT_TOTAL") + nft_amount;
    uint64_t hold_total = get_state_u64("HOLD_TOTAL") + hold_amount;
    uint64_t trea_total = get_state_u64("TREA_TOTAL") + trea_amount;
    uint64_t amm_total = get_state_u64("AMM_TOTAL") + amm_amount;

    // Save updated state
    if (set_state_u64("TOTAL_DIST", total_distributed) < 0 ||
        set_state_u64("NFT_TOTAL", nft_total) < 0 ||
        set_state_u64("HOLD_TOTAL", hold_total) < 0 ||
        set_state_u64("TREA_TOTAL", trea_total) < 0 ||
        set_state_u64("AMM_TOTAL", amm_total) < 0) {
        return rollback(SBUF(ERR_STATE_FAILED), 1);
    }

    // Update distribution count
    uint64_t dist_count = get_state_u64("DIST_COUNT") + 1;
    set_state_u64("DIST_COUNT", dist_count);

    // Update last distribution timestamp
    set_state_u64("LAST_DIST", (uint64_t)ledger_time());

    return accept(SBUF("fees routed"), 0);
}

// Callback function (required but unused)
int64_t cbak(int64_t reserved) {
    return 0;
}