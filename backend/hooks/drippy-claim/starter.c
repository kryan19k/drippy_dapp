/**
 * DRIPPY Claim Hook - Based on Starter Template
 * Purpose: Basic reward claiming functionality
 * Triggers: Payments with "CLAIM" memo to this account
 */
#include "hookapi.h"

int64_t hook(uint32_t reserved) {

    TRACESTR("DRIPPY Claim: Called.");

    // Only process payments
    if (otxn_type() != ttPAYMENT) {
        accept(SBUF("DRIPPY Claim: Not a payment"), 0);
        _g(1,1);   // every hook needs to import guard function and use it at least once
        return 0;
    }

    // Check if payment is to our account
    uint8_t destination[20];
    uint8_t our_account[20];

    if (otxn_field(SBUF(destination), sfDestination) != 20) {
        rollback(SBUF("DRIPPY Claim: No destination"), 1);
        _g(1,1);
        return 0;
    }

    hook_account(SBUF(our_account));

    // Check if payment is to us
    int is_to_us = 0;
    BUFFER_EQUAL(is_to_us, destination, our_account, 20);
    if (!is_to_us) {
        accept(SBUF("DRIPPY Claim: Not for us"), 0);
        _g(1,1);
        return 0;
    }

    // Check for CLAIM memo
    uint8_t memos_buffer[512];
    int memos_len = otxn_field(SBUF(memos_buffer), sfMemos);
    int has_claim = 0;

    if (memos_len > 0) {
        // Simple pattern search for "CLAIM"
        for (int i = 0; GUARD(500), i < memos_len - 4; ++i) {
            if (memos_buffer[i] == 'C' && memos_buffer[i+1] == 'L' &&
                memos_buffer[i+2] == 'A' && memos_buffer[i+3] == 'I' &&
                memos_buffer[i+4] == 'M') {
                has_claim = 1;
                break;
            }
        }
    }

    if (!has_claim) {
        // No CLAIM memo, check if admin is depositing
        accept(SBUF("DRIPPY Claim: Deposit accepted"), 0);
        _g(1,1);
        return 0;
    }

    // Get the sender (claimant)
    uint8_t sender[20];
    if (otxn_field(SBUF(sender), sfAccount) != 20) {
        rollback(SBUF("DRIPPY Claim: Invalid sender"), 2);
        _g(1,1);
        return 0;
    }

    // Generate state key for this account
    uint8_t state_key[32];
    for (int i = 0; GUARD(32), i < 32; ++i) {
        state_key[i] = 0;
    }

    // Prefix: "DRIPPY:"
    state_key[0] = 'D'; state_key[1] = 'R'; state_key[2] = 'I';
    state_key[3] = 'P'; state_key[4] = 'P'; state_key[5] = 'Y'; state_key[6] = ':';

    // Add account ID
    for (int i = 0; GUARD(20), i < 20; ++i) {
        state_key[7 + i] = sender[i];
    }

    // Read current balance from state
    uint8_t balance_data[8];
    int state_result = state(SBUF(balance_data), SBUF(state_key));
    uint64_t balance = 0;

    if (state_result == 8) {
        balance = UINT64_FROM_BUF(balance_data);
    }

    TRACEVAR(balance);

    if (balance == 0) {
        rollback(SBUF("DRIPPY Claim: No balance"), 3);
        _g(1,1);
        return 0;
    }

    // Calculate claim amount (max 1000 XRP for safety)
    uint64_t claim_amount = balance;
    uint64_t max_claim = 1000000000; // 1000 XRP in drops

    if (claim_amount > max_claim) {
        claim_amount = max_claim;
    }

    // Check minimum claim (1 XRP)
    if (claim_amount < 1000000) {
        rollback(SBUF("DRIPPY Claim: Below minimum"), 4);
        _g(1,1);
        return 0;
    }

    TRACEVAR(claim_amount);

    // For now, just update the balance (mark as claimed)
    // In production, this would emit a payment back to the claimant
    uint64_t new_balance = balance - claim_amount;
    UINT64_TO_BUF(balance_data, new_balance);

    if (state_set(SBUF(balance_data), SBUF(state_key)) < 0) {
        rollback(SBUF("DRIPPY Claim: State update failed"), 5);
        _g(1,1);
        return 0;
    }

    TRACEVAR(new_balance);

    // Accept the claim transaction
    accept(SBUF("DRIPPY Claim: Claimed successfully"), 0);

    _g(1,1);   // every hook needs to import guard function and use it at least once
    // unreachable
    return 0;
}