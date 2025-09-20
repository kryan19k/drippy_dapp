// Minimal Claim/Accrual Hook template (Xahau Hooks API)
// - Two memo ops on incoming Payment to the hooked account:
//   1) "CLAIM": claimant requests payout of their accrued balance (drops or IOU)
//      Guards: optional MAXP (max per claim) and COOLD (cooldown seconds)
//   2) "ACC"  : ADMIN increments accrual for a target account (guarded)
// HookParameters (hex values):
//   ADMIN   : 20-byte account id (required to allow ACC)
//   CUR     : 20-byte currency code (IOU payout if present together with ISSUER)
//   ISSUER  : 20-byte issuer account id for IOU payout
//   MAXP    : 8-byte u64 (max drops per single claim, 0 = unlimited)
//   COOLD   : 8-byte u64 (cooldown seconds between claims, 0 = none)
// State layout per account: 16 bytes => [0..7]=u64 accrual_drops, [8..15]=u64 last_claim_epoch
// Namespace for state key derived from claimant 20-byte account id.

#include "hookapi.h"
#include "simple_emit.h"
#define HAVE_SIMPLE_EMIT 1

#define KEYLEN 32

// Util: parse memo blobs by type/format (simple example)
static int memo_has_type(uint32_t memo_slot, const char* type) {
    uint32_t type_slot = slot_subfield(memo_slot, sfMemoType, 0);
    if (type_slot == DOESNT_EXIST) return 0;
    uint8_t buf[32]; int64_t len = slot(SBUF(buf), type_slot);
    if (len <= 0) return 0;
    // Compare (case-sensitive) up to buffer size
    int i=0; for (; type[i] && i<len && i<32; ++i) { if (buf[i] != (uint8_t)type[i]) return 0; }
    return type[i] == '\0';
}

static int read_memo_data(uint32_t memo_slot, uint8_t* out, int64_t max) {
    uint32_t data_slot = slot_subfield(memo_slot, sfMemoData, 0);
    if (data_slot == DOESNT_EXIST) return DOESNT_EXIST;
    return slot(out, max, data_slot);
}

// State key: 32 bytes -> first 12 bytes prefix, next 20 bytes claimant account id
static void make_state_key(uint8_t key[KEYLEN], const uint8_t* acct20) {
    // Namespace: "DRIPPY:CLAIM:v1\0\0\0\0\0\0\0\0" (12 bytes)
    uint8_t prefix[12] = { 'D','R','I','P','P','Y',':','C','L','A','I','M' };
    for (int i=0;i<12;i++) key[i]=prefix[i];
    for (int j=0;j<20;j++) key[12+j]=acct20[j];
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
        // sfMemos is an array of memo objects: each has sfMemo with subfields
        for (int i=0;;++i) {
            uint32_t memo_arr = slot_subarray(memos_slot, i);
            if (memo_arr == DOESNT_EXIST) break;
            uint32_t memo_obj = slot_subfield(memo_arr, sfMemo, 0);
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
    otxn_field(SBUF(dst_accid), sfDestination);

    if (op == OP_CLAIM) {
        // Claimant is the transaction Account (source)
        uint8_t claimant[20];
        otxn_field(SBUF(claimant), sfAccount);

        uint8_t key[KEYLEN]; make_state_key(key, claimant);
        uint8_t stored[16]; int64_t have = state(SBUF(stored), key, KEYLEN);
        if (have != 16 && have != 8) {
            // nothing to claim
            return accept(SBUF("no accrual"), 0);
        }
        // parse u64 from stored (big-endian)
        uint64_t drops = UINT64_FROM_BUF(stored);
        uint64_t last_claim = 0;
        if (have == 16) last_claim = UINT64_FROM_BUF(stored + 8);
        if (drops == 0) return accept(SBUF("zero"), 0);

        // Guards: MAXP / COOLD
        uint8_t maxpbuf[8]; int has_maxp = (param_read(SBUF(maxpbuf), "MAXP") == 8);
        uint64_t maxp = has_maxp ? UINT64_FROM_BUF(maxpbuf) : 0; // 0 = unlimited
        uint8_t cooldbuf[8]; int has_coold = (param_read(SBUF(cooldbuf), "COOLD") == 8);
        uint64_t coold = has_coold ? UINT64_FROM_BUF(cooldbuf) : 0;
        if (coold) {
            uint64_t now = (uint64_t)ledger_time();
            if (last_claim && now < last_claim + coold)
                return rollback(SBUF("cooldown"), 1);
        }
        uint64_t pay_amt = drops;
        if (maxp && pay_amt > maxp) pay_amt = maxp;

        // Determine payout mode: IOU if CUR and ISSUER set, else native drops
        uint8_t cur20[20]; int has_cur = (param_read(SBUF(cur20), "CUR") == 20);
        uint8_t issuer20[20]; int has_iss = (param_read(SBUF(issuer20), "ISSUER") == 20);

        etxn_reserve(1);
        uint8_t payment[640]; uint8_t* p = payment;
        // Use simple emit helpers from official toolchain if available
#ifdef HAVE_SIMPLE_EMIT
        if (has_cur && has_iss) {
            // IOU payout; here we encode integer value (no decimal scaling). Adjust to your currency decimals as needed.
            p += PREPARE_PAYMENT_SIMPLE_ISSUED(p, (int64_t)(payment + sizeof(payment) - p), dst_accid, claimant, cur20, issuer20, pay_amt);
        } else {
            p += PREPARE_PAYMENT_SIMPLE_DROPS(p, (int64_t)(payment + sizeof(payment) - p), dst_accid, claimant, pay_amt);
        }
#else
        // If helper macros not available, abort with clear message for build-time
        return rollback(SBUF("emit helpers missing"), 1);
#endif
        int64_t emit_result = emit(SBUF(payment));
        if (emit_result < 0) return rollback(SBUF("emit failed"), 1);

        // subtract payout and set last claim epoch
        uint64_t remain = drops - pay_amt;
        uint8_t outstate[16] = {0};
        UINT64_TO_BUF(outstate, remain);
        UINT64_TO_BUF(outstate + 8, (uint64_t)ledger_time());
        if (state_set(SBUF(outstate), key, KEYLEN) < 0) {
            return rollback(SBUF("state_set fail"), 1);
        }
        return accept(SBUF("claimed"), 0);
    }

    if (op == OP_ACC) {
        // Admin guard: only allow from ADMIN parameter
        uint8_t admin20[20];
        if (param_read(SBUF(admin20), "ADMIN") != 20) return rollback(SBUF("no admin"), 1);
        uint8_t src20[20];
        otxn_field(SBUF(src20), sfAccount);
        if (!is_equal20(admin20, src20)) return rollback(SBUF("forbidden"), 1);

        // Admin increments accrual for account in ACC_A, value ACC_V (hex)
        // Decode acc_hex (40 hex chars) to 20 bytes
        uint8_t acct20[20];
        if (unhexlify(SBUF(acct20), acc_hex, 40) != 20) return rollback(SBUF("bad acc"), 1);

        // Decode amount from hex (u64 big-endian)
        uint8_t amtbuf[8] = {0};
        int hexlen = amt_hex_len; if (hexlen > 16) hexlen = 16;
        // place right-aligned in amtbuf
// Read HookParameter by ascii name
static int param_read(uint8_t* out, int64_t outlen, const char* name) {
    return hook_param(out, outlen, (uint8_t*)name, (int64_t)strlen(name));
}

static int is_equal20(const uint8_t* a, const uint8_t* b){
    int i=0; for(;i<20;i++){ if(a[i]!=b[i]) return 0; } return 1;
}
        if (hexlen > 0) {
            int bytes = (hexlen+1)/2; // round up
            if (unhexlify(amtbuf + (8 - bytes), amt_hex, hexlen) != bytes) return rollback(SBUF("bad val"), 1);
        }
        uint64_t add = UINT64_FROM_BUF(amtbuf);

        uint8_t key[KEYLEN]; make_state_key(key, acct20);
        uint8_t stored[8] = {0}; int64_t have = state(SBUF(stored), key, KEYLEN);
        uint64_t cur = 0; if (have == 8) cur = UINT64_FROM_BUF(stored);
        uint64_t nxt = cur + add;
        UINT64_TO_BUF(stored, nxt);
        if (state_set(SBUF(stored), key, KEYLEN) < 0)
            return rollback(SBUF("state_set fail"), 1);
        return accept(SBUF("acc ok"), 0);
    }

    return accept(0,0,0);
}
