// DRIPPY Fee Router Hook - Fixed for Hooks Builder
// Purpose: Automatically route incoming protocol fees to reward pools
// Triggers: Payments to the treasury/issuer account

#include "hookapi.h"

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

// Convert buffer to uint32
uint32_t bytes_to_uint32(const uint8_t* buf) {
    uint32_t result = 0;
    for (int i = 0; i < 4; i++) {
        result = (result << 8) | buf[i];
    }
    return result;
}

// Get parameter as uint32 with default
uint32_t get_param_u32(const char* name, uint32_t default_val) {
    uint8_t buf[4];
    int name_len = get_str_len(name);
    if (hook_param(ptr_to_u32(buf), 4, ptr_to_u32(name), name_len) == 4) {
        return bytes_to_uint32(buf);
    }
    return default_val;
}

// Get parameter as uint64 with default
uint64_t get_param_u64(const char* name, uint64_t default_val) {
    uint8_t buf[8];
    int name_len = get_str_len(name);
    if (hook_param(ptr_to_u32(buf), 8, ptr_to_u32(name), name_len) == 8) {
        return bytes_to_uint64(buf);
    }
    return default_val;
}

// Get parameter as account (20 bytes)
int get_param_account(uint8_t* account, const char* name) {
    int name_len = get_str_len(name);
    return hook_param(ptr_to_u32(account), 20, ptr_to_u32(name), name_len) == 20;
}

// Create state key
void make_state_key(uint8_t* key, const char* suffix) {
    clear_array(key, 32);

    // Prefix: "DRIPPY:ROUTER:"
    const char* prefix = "DRIPPY:ROUTER:";
    int prefix_len = get_str_len(prefix);
    copy_array(key, (const uint8_t*)prefix, prefix_len);

    // Add suffix
    int suffix_len = get_str_len(suffix);
    copy_array(key + prefix_len, (const uint8_t*)suffix, suffix_len);
}

// Get uint64 from state
uint64_t get_state_u64(const char* key_suffix) {
    uint8_t key[32];
    uint8_t buf[8];

    make_state_key(key, key_suffix);

    if (state(ptr_to_u32(buf), 8, ptr_to_u32(key), 32) == 8) {
        return bytes_to_uint64(buf);
    }
    return 0;
}

// Set uint64 to state
int set_state_u64(const char* key_suffix, uint64_t value) {
    uint8_t key[32];
    uint8_t buf[8];

    make_state_key(key, key_suffix);
    uint64_to_bytes(buf, value);

    return state_set(ptr_to_u32(buf), 8, ptr_to_u32(key), 32);
}

// Check if anti-sniping is active
int is_anti_sniping_active() {
    uint64_t anti_snipe_end = get_param_u64("ANTI_SNIPE", 0);
    if (anti_snipe_end == 0) return 0; // Disabled

    uint64_t now = (uint64_t)ledger_last_time();
    return now < anti_snipe_end;
}

// Check if sender is admin
int sender_is_admin() {
    uint8_t admin_account[20];
    uint8_t sender[20];

    if (!get_param_account(admin_account, "ADMIN")) return 0;
    if (otxn_field(ptr_to_u32(sender), 20, sfAccount) != 20) return 0;

    // Compare accounts
    for (int i = 0; i < 20; i++) {
        if (admin_account[i] != sender[i]) return 0;
    }
    return 1;
}

// Emit payment to pool (simplified - tracks distribution only)
int distribute_to_pool(const uint8_t* pool_account, uint64_t amount, const char* pool_name) {
    // For now, just track in state (in production, emit actual payments)
    uint64_t current_total = get_state_u64(pool_name);
    set_state_u64(pool_name, current_total + amount);

    return 1; // Success
}

// Process fee distribution
int process_fee_distribution(uint64_t total_amount) {
    // Get allocation percentages
    uint32_t nft_alloc = get_param_u32("NFT_ALLOC", 40);
    uint32_t hold_alloc = get_param_u32("HOLD_ALLOC", 30);
    uint32_t trea_alloc = get_param_u32("TREA_ALLOC", 20);
    uint32_t amm_alloc = get_param_u32("AMM_ALLOC", 10);

    // Validate allocations sum to 100
    if (nft_alloc + hold_alloc + trea_alloc + amm_alloc != 100) {
        return rollback(ptr_to_u32("bad allocation"), get_str_len("bad allocation"), 1);
    }

    // Calculate amounts
    uint64_t nft_amount = (total_amount * nft_alloc) / 100;
    uint64_t hold_amount = (total_amount * hold_alloc) / 100;
    uint64_t trea_amount = (total_amount * trea_alloc) / 100;
    uint64_t amm_amount = total_amount - nft_amount - hold_amount - trea_amount; // Remainder

    // Get pool accounts
    uint8_t nft_pool[20], hold_pool[20], trea_pool[20], amm_pool[20];
    if (!get_param_account(nft_pool, "NFT_POOL")) {
        return rollback(ptr_to_u32("no nft pool"), get_str_len("no nft pool"), 2);
    }
    if (!get_param_account(hold_pool, "HOLD_POOL")) {
        return rollback(ptr_to_u32("no hold pool"), get_str_len("no hold pool"), 3);
    }
    if (!get_param_account(trea_pool, "TREA_POOL")) {
        return rollback(ptr_to_u32("no trea pool"), get_str_len("no trea pool"), 4);
    }
    if (!get_param_account(amm_pool, "AMM_POOL")) {
        return rollback(ptr_to_u32("no amm pool"), get_str_len("no amm pool"), 5);
    }

    // Distribute to pools (for now, just track in state)
    distribute_to_pool(nft_pool, nft_amount, "NFT_TOTAL");
    distribute_to_pool(hold_pool, hold_amount, "HOLD_TOTAL");
    distribute_to_pool(trea_pool, trea_amount, "TREA_TOTAL");
    distribute_to_pool(amm_pool, amm_amount, "AMM_TOTAL");

    // Update global stats
    uint64_t total_distributed = get_state_u64("TOTAL_DIST");
    set_state_u64("TOTAL_DIST", total_distributed + total_amount);
    set_state_u64("LAST_DIST", (uint64_t)ledger_last_time());

    return accept(ptr_to_u32("distributed"), get_str_len("distributed"), 0);
}

// Main hook function
int64_t hook(int64_t reserved) {
    // Only handle payments
    if (otxn_type() != ttPAYMENT) {
        return accept(ptr_to_u32("not payment"), get_str_len("not payment"), 0);
    }

    // Check if payment is to our account (treasury/issuer)
    uint8_t destination[20];
    uint8_t our_account[20];

    if (otxn_field(ptr_to_u32(destination), 20, sfDestination) != 20) {
        return rollback(ptr_to_u32("no dest"), get_str_len("no dest"), 1);
    }

    hook_account(ptr_to_u32(our_account), 20);

    // Check if payment is to us
    int is_to_us = 1;
    for (int i = 0; i < 20; i++) {
        if (destination[i] != our_account[i]) {
            is_to_us = 0;
            break;
        }
    }

    if (!is_to_us) {
        return accept(ptr_to_u32("not for us"), get_str_len("not for us"), 0);
    }

    // Get payment amount (XRP only for simplicity)
    uint8_t amount_buf[8];
    if (otxn_field(ptr_to_u32(amount_buf), 8, sfAmount) != 8) {
        return accept(ptr_to_u32("not xrp"), get_str_len("not xrp"), 0);
    }

    uint64_t amount = bytes_to_uint64(amount_buf);

    // Check minimum amount
    uint64_t min_amount = get_param_u64("MIN_AMOUNT", 1000000); // Default 1 XRP
    if (amount < min_amount) {
        return accept(ptr_to_u32("too small"), get_str_len("too small"), 0);
    }

    // Check anti-sniping
    if (is_anti_sniping_active()) {
        return rollback(ptr_to_u32("anti snipe"), get_str_len("anti snipe"), 6);
    }

    // Apply fee (optional)
    uint32_t fee_bps = get_param_u32("FEE_BPS", 0); // Default no fee
    uint64_t fee_amount = 0;
    if (fee_bps > 0) {
        fee_amount = (amount * fee_bps) / 10000;
        amount -= fee_amount;
    }

    // Process the distribution
    return process_fee_distribution(amount);
}

// Required callback function
int64_t cbak(int64_t reserved) {
    return 0;
}