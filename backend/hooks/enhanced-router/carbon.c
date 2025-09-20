#define HAS_CALLBACK
#include <stdint.h>
#include "hookapi.h"

int64_t cbak(uint32_t reserved)
{
    TRACESTR("DRIPPY Enhanced Router: callback called.");
    return 0;
}

int64_t hook(uint32_t reserved)
{
    TRACESTR("DRIPPY Enhanced Router: started");

    // Reserve multiple emission slots for complex distributions
    etxn_reserve(10);

    // Get our hook account (treasury)
    unsigned char hook_accid[20];
    hook_account(SBUF(hook_accid));

    // Get transaction details
    uint8_t sender[20];
    uint8_t destination[20];

    if (otxn_field(SBUF(sender), sfAccount) != 20) {
        rollback(SBUF("Enhanced Router: Invalid sender"), 1);
    }

    if (otxn_field(SBUF(destination), sfDestination) != 20) {
        rollback(SBUF("Enhanced Router: Invalid destination"), 2);
    }

    // Check if payment is to us (treasury)
    int is_to_us = 0;
    BUFFER_EQUAL(is_to_us, destination, hook_accid, 20);
    if (!is_to_us) {
        accept(SBUF("Enhanced Router: Not for treasury"), 0);
    }

    // Get payment amount (XRP only for this version)
    unsigned char amount_buffer[48];
    int64_t amount_len = otxn_field(SBUF(amount_buffer), sfAmount);

    if (amount_len != 8) {
        accept(SBUF("Enhanced Router: Non-XRP payment"), 0);
    }

    int64_t total_fee = AMOUNT_TO_DROPS(amount_buffer);
    TRACEVAR(total_fee);

    // Minimum distribution check
    if (total_fee < 1000000) { // 1 XRP minimum
        accept(SBUF("Enhanced Router: Amount too small"), 0);
    }

    // Enhanced Distribution Logic (based on your original design)

    // 1. NFT Holder Rewards (1% of fees as XRP)
    int64_t nft_reward_total = (total_fee * 100) / 10000; // 1%

    // 2. Token Holder Rewards (2% of fees as DRIPPY)
    int64_t holder_reward_total = (total_fee * 200) / 10000; // 2%

    // 3. Treasury (1%)
    int64_t treasury_share = (total_fee * 100) / 10000; // 1%

    // 4. AMM Deposit (1%)
    int64_t amm_deposit = (total_fee * 100) / 10000; // 1%

    // 5. XRP LP Rewards (0.5%)
    int64_t xrp_lp_reward = (total_fee * 50) / 10000; // 0.5%

    // 6. DRIPPY LP Rewards (0.5%)
    int64_t drippy_lp_reward = (total_fee * 50) / 10000; // 0.5%

    TRACEVAR(nft_reward_total);
    TRACEVAR(holder_reward_total);
    TRACEVAR(treasury_share);
    TRACEVAR(amm_deposit);
    TRACEVAR(xrp_lp_reward);
    TRACEVAR(drippy_lp_reward);

    // Get pool account addresses
    uint8_t nft_pool[20];
    uint8_t holder_pool[20];
    uint8_t treasury_pool[20];
    uint8_t amm_pool[20];
    uint8_t xrp_lp_pool[20];
    uint8_t drippy_lp_pool[20];

    // Convert pool addresses
    int64_t ret1 = util_accid(SBUF(nft_pool), SBUF("rh5JLb9NyCWWBxJpHq1Y4HYasNGNrKCLry"));
    int64_t ret2 = util_accid(SBUF(holder_pool), SBUF("rhsF68XHLvUZYFtRBNDpK2Sv6LLr5dRRJX"));
    int64_t ret3 = util_accid(SBUF(treasury_pool), SBUF("rUWEnNWzwJKDDJeZJD3EqgrcT4rK14G2PZ"));
    int64_t ret4 = util_accid(SBUF(amm_pool), SBUF("rh48SvzCMepxACy9d85SaaRXkyur87zwuj"));
    int64_t ret5 = util_accid(SBUF(xrp_lp_pool), SBUF("rh5JLb9NyCWWBxJpHq1Y4HYasNGNrKCLry")); // Reuse NFT pool for now
    int64_t ret6 = util_accid(SBUF(drippy_lp_pool), SBUF("rhsF68XHLvUZYFtRBNDpK2Sv6LLr5dRRJX")); // Reuse holder pool

    if (ret1 < 0 || ret2 < 0 || ret3 < 0 || ret4 < 0 || ret5 < 0 || ret6 < 0) {
        rollback(SBUF("Enhanced Router: Invalid pool addresses"), 3);
    }

    // Create distribution transactions
    unsigned char tx1[PREPARE_PAYMENT_SIMPLE_SIZE]; // NFT rewards
    unsigned char tx2[PREPARE_PAYMENT_SIMPLE_SIZE]; // Holder rewards
    unsigned char tx3[PREPARE_PAYMENT_SIMPLE_SIZE]; // Treasury
    unsigned char tx4[PREPARE_PAYMENT_SIMPLE_SIZE]; // AMM
    unsigned char tx5[PREPARE_PAYMENT_SIMPLE_SIZE]; // XRP LP
    unsigned char tx6[PREPARE_PAYMENT_SIMPLE_SIZE]; // DRIPPY LP

    // Prepare all distribution payments
    PREPARE_PAYMENT_SIMPLE(tx1, nft_reward_total, nft_pool, 1001, 0); // Tag 1001 = NFT rewards
    PREPARE_PAYMENT_SIMPLE(tx2, holder_reward_total, holder_pool, 1002, 0); // Tag 1002 = Holder rewards
    PREPARE_PAYMENT_SIMPLE(tx3, treasury_share, treasury_pool, 1003, 0); // Tag 1003 = Treasury
    PREPARE_PAYMENT_SIMPLE(tx4, amm_deposit, amm_pool, 1004, 0); // Tag 1004 = AMM
    PREPARE_PAYMENT_SIMPLE(tx5, xrp_lp_reward, xrp_lp_pool, 1005, 0); // Tag 1005 = XRP LP
    PREPARE_PAYMENT_SIMPLE(tx6, drippy_lp_reward, drippy_lp_pool, 1006, 0); // Tag 1006 = DRIPPY LP

    // Emit all distribution transactions
    uint8_t hash1[32], hash2[32], hash3[32], hash4[32], hash5[32], hash6[32];

    int64_t emit1 = emit(SBUF(hash1), SBUF(tx1));
    int64_t emit2 = emit(SBUF(hash2), SBUF(tx2));
    int64_t emit3 = emit(SBUF(hash3), SBUF(tx3));
    int64_t emit4 = emit(SBUF(hash4), SBUF(tx4));
    int64_t emit5 = emit(SBUF(hash5), SBUF(tx5));
    int64_t emit6 = emit(SBUF(hash6), SBUF(tx6));

    TRACEVAR(emit1);
    TRACEVAR(emit2);
    TRACEVAR(emit3);
    TRACEVAR(emit4);
    TRACEVAR(emit5);
    TRACEVAR(emit6);

    // Check if all emissions succeeded
    if (emit1 < 0 || emit2 < 0 || emit3 < 0 || emit4 < 0 || emit5 < 0 || emit6 < 0) {
        rollback(SBUF("Enhanced Router: Distribution failed"), 4);
    }

    // Store distribution statistics in state
    uint8_t stats_key[32];
    for (int i = 0; GUARD(32), i < 32; ++i) {
        stats_key[i] = 0;
    }

    // Key: "STATS:TOTAL"
    stats_key[0] = 'S'; stats_key[1] = 'T'; stats_key[2] = 'A'; stats_key[3] = 'T'; stats_key[4] = 'S';
    stats_key[5] = ':'; stats_key[6] = 'T'; stats_key[7] = 'O'; stats_key[8] = 'T'; stats_key[9] = 'A'; stats_key[10] = 'L';

    // Read current total
    uint8_t current_total_buf[8];
    uint64_t current_total = 0;
    if (state(SBUF(current_total_buf), SBUF(stats_key)) == 8) {
        current_total = UINT64_FROM_BUF(current_total_buf);
    }

    // Update total
    current_total += total_fee;
    UINT64_TO_BUF(current_total_buf, current_total);
    state_set(SBUF(current_total_buf), SBUF(stats_key));

    // Store last distribution time
    uint8_t time_key[32];
    for (int i = 0; GUARD(32), i < 32; ++i) {
        time_key[i] = 0;
    }
    time_key[0] = 'L'; time_key[1] = 'A'; time_key[2] = 'S'; time_key[3] = 'T';
    time_key[4] = '_'; time_key[5] = 'T'; time_key[6] = 'I'; time_key[7] = 'M'; time_key[8] = 'E';

    uint8_t time_buf[8];
    uint64_t current_time = (uint64_t)ledger_last_time();
    UINT64_TO_BUF(time_buf, current_time);
    state_set(SBUF(time_buf), SBUF(time_key));

    TRACEVAR(current_total);
    TRACEVAR(current_time);

    // Calculate total distributed for verification
    int64_t total_distributed = nft_reward_total + holder_reward_total + treasury_share +
                               amm_deposit + xrp_lp_reward + drippy_lp_reward;

    TRACEVAR(total_distributed);

    accept(SBUF("Enhanced Router: All distributions complete"), 0);
    return 0;
}