// DRIPPY Simple Claim Hook - Web Compatible Version
// Purpose: Allow users to claim accumulated rewards
// Triggers: Payments with "CLAIM" memo to the claim pool account

#include "hookapi.h"

#define KEYLEN 32

// Utility: parse memo blobs by type/format (simple example)
static int memo_has_type(uint32_t memo_slot, const char* type) {
    uint32_t type_slot = slot_subfield(memo_slot, sfMemoType, 0);
    if (type_slot == DOESNT_EXIST) return 0;
    uint8_t buf[32];
    int64_t len = slot(buf, 32, type_slot);
    if (len <= 0) return 0;
    // Compare (case-sensitive) up to buffer size
    int i=0;
    for (; type[i] && i<len && i<32; ++i) {
        if (buf[i] != (uint8_t)type[i]) return 0;
    }
    return type[i] == '\0';
}

static int read_memo_data(uint32_t memo_slot, uint8_t* out, int64_t max) {
    uint32_t data_slot = slot_subfield(memo_slot, sfMemoData, 0);
    if (data_slot == DOESNT_EXIST) return DOESNT_EXIST;
    return slot(out, max, data_slot);
}

// State key: 32 bytes -> first 12 bytes prefix, next 20 bytes claimant account id
static void make_state_key(uint8_t key[KEYLEN], const uint8_t* acct20) {
    // Namespace: "DRIPPY:CLAIM" (12 bytes)
    uint8_t prefix[12] = { 'D','R','I','P','P','Y',':','C','L','A','I','M' };
    for (int i=0;i<12;i++) key[i]=prefix[i];
    for (int j=0;j<20;j++) key[12+j]=acct20[j];
}

// Read HookParameter by ascii name
static int param_read(uint8_t* out, int64_t outlen, const char* name) {
    return hook_param(out, outlen, name, ___builtin_strlen(name));
}

static int is_equal20(const uint8_t* a, const uint8_t* b){
    int i=0;
    for(;i<20;i++){
        if(a[i]!=b[i]) return 0;
    }
    return 1;
}

int64_t hook(int64_t reserved) {
    // Only process Payments
    if (otxn_type() != ttPAYMENT) return accept(0,0,0);

    // Collect Memos
    uint32_t memos_slot = otxn_field_slot(sfMemos, 0);
    int has_memos = (memos_slot != DOESNT_EXIST);

    // Identify op and payload
    enum { OP_NONE, OP_CLAIM, OP_ACC } op = OP_NONE;
    uint8_t acc_hex[64]; int acc_hex_len = 0; // when OP_ACC: 40 hex chars (20 bytes)
    uint8_t amt_hex[32]; int amt_hex_len = 0; // when OP_ACC: 16 hex chars (u64)

    if (has_memos) {
        // Iterate array of memos
        for (int i=0;;++i) {
            uint32_t memo_arr_slot = 0;
            if (slot_subarray(memos_slot, i, memo_arr_slot) < 0) break;

            uint32_t memo_obj = slot_subfield(memo_arr_slot, sfMemo, 0);
            if (memo_obj == DOESNT_EXIST) continue;

            // If MemoType == "CLAIM", set OP_CLAIM
            if (memo_has_type(memo_obj, "CLAIM")) {
                op = OP_CLAIM;
            }
            // If MemoType == "ACC_A", read account hex (20-byte hex)
            else if (memo_has_type(memo_obj, "ACC_A")) {
                acc_hex_len = read_memo_data(memo_obj, acc_hex, sizeof(acc_hex));
                if (acc_hex_len < 40) acc_hex_len = 0; // require 40 hex chars
            }
            // If MemoType == "ACC_V", read amount hex (u64 drops, hex)
            else if (memo_has_type(memo_obj, "ACC_V")) {
                amt_hex_len = read_memo_data(memo_obj, amt_hex, sizeof(amt_hex));
                if (amt_hex_len < 1) amt_hex_len = 0;
            }
        }
        if (acc_hex_len && amt_hex_len) op = OP_ACC;
    }

    // Fetch source/destination
    uint8_t dst_accid[20];
    otxn_field(dst_accid, 20, sfDestination);

    if (op == OP_CLAIM) {
        // Claimant is the transaction Account (source)
        uint8_t claimant[20];
        otxn_field(claimant, 20, sfAccount);

        uint8_t key[KEYLEN];
        make_state_key(key, claimant);
        uint8_t stored[16];
        int64_t have = state(stored, 16, key, KEYLEN);

        if (have != 16 && have != 8) {
            // nothing to claim
            return accept("no accrual", 10, 0);
        }

        // parse u64 from stored (big-endian)
        uint64_t drops = UINT64_FROM_BUF(stored);
        uint64_t last_claim = 0;
        if (have == 16) last_claim = UINT64_FROM_BUF(stored + 8);
        if (drops == 0) return accept("zero", 4, 0);

        // Guards: MAXP / COOLD
        uint8_t maxpbuf[8];
        int has_maxp = (param_read(maxpbuf, 8, "MAXP") == 8);
        uint64_t maxp = has_maxp ? UINT64_FROM_BUF(maxpbuf) : 0; // 0 = unlimited

        uint8_t cooldbuf[8];
        int has_coold = (param_read(cooldbuf, 8, "COOLD") == 8);
        uint64_t coold = has_coold ? UINT64_FROM_BUF(cooldbuf) : 0;

        if (coold) {
            uint64_t now = (uint64_t)ledger_last_time();
            if (last_claim && now < last_claim + coold)
                return rollback("cooldown", 8, 1);
        }

        uint64_t pay_amt = drops;
        if (maxp && pay_amt > maxp) pay_amt = maxp;

        // Determine payout mode: IOU if CUR and ISSUER set, else native drops
        uint8_t cur20[20];
        int has_cur = (param_read(cur20, 20, "CUR") == 20);
        uint8_t issuer20[20];
        int has_iss = (param_read(issuer20, 20, "ISSUER") == 20);

        etxn_reserve(1);
        uint8_t payment[256];

        if (has_cur && has_iss) {
            // IOU payout
            PREPARE_PAYMENT_SIMPLE_TRUSTLINE(payment, pay_amt, claimant, 0, 0);
        } else {
            // XRP payout
            PREPARE_PAYMENT_SIMPLE(payment, pay_amt, claimant, 0, 0);
        }

        int64_t emit_result = emit(payment, PREPARE_PAYMENT_SIMPLE_SIZE, 0, 0);
        if (emit_result < 0) return rollback("emit failed", 11, 1);

        // subtract payout and set last claim epoch
        uint64_t remain = drops - pay_amt;
        uint8_t outstate[16] = {0};
        UINT64_TO_BUF(outstate, remain);
        UINT64_TO_BUF(outstate + 8, (uint64_t)ledger_last_time());

        if (state_set(outstate, 16, key, KEYLEN) < 0) {
            return rollback("state_set fail", 14, 1);
        }
        return accept("claimed", 7, 0);
    }

    if (op == OP_ACC) {
        // Admin guard: only allow from ADMIN parameter
        uint8_t admin20[20];
        if (param_read(admin20, 20, "ADMIN") != 20)
            return rollback("no admin", 8, 1);

        uint8_t src20[20];
        otxn_field(src20, 20, sfAccount);
        if (!is_equal20(admin20, src20))
            return rollback("forbidden", 9, 1);

        // Admin increments accrual for account in ACC_A, value ACC_V (hex)
        // Decode acc_hex (40 hex chars) to 20 bytes
        uint8_t acct20[20];
        if (unhexlify(acct20, 20, acc_hex, 40) != 20)
            return rollback("bad acc", 7, 1);

        // Decode amount from hex (u64 big-endian)
        uint8_t amtbuf[8] = {0};
        int hexlen = amt_hex_len;
        if (hexlen > 16) hexlen = 16;

        if (hexlen > 0) {
            int bytes = (hexlen+1)/2; // round up
            if (unhexlify(amtbuf + (8 - bytes), 8 - bytes, amt_hex, hexlen) != bytes)
                return rollback("bad val", 7, 1);
        }
        uint64_t add = UINT64_FROM_BUF(amtbuf);

        uint8_t key[KEYLEN];
        make_state_key(key, acct20);
        uint8_t stored[8] = {0};
        int64_t have = state(stored, 8, key, KEYLEN);
        uint64_t cur = 0;
        if (have == 8) cur = UINT64_FROM_BUF(stored);
        uint64_t nxt = cur + add;
        UINT64_TO_BUF(stored, nxt);

        if (state_set(stored, 8, key, KEYLEN) < 0)
            return rollback("state_set fail", 14, 1);
        return accept("acc ok", 6, 0);
    }

    return accept(0,0,0);
}

int64_t cbak(int64_t reserved) {
    return 0;
}