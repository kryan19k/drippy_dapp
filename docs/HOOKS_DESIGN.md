Drippy Hooks Architecture (XRPL/Xahau)

Overview
- Goal: Provide real on-chain token utility using Xahau Hooks while keeping UX simple in the DApp.
- Approach: Use a small set of Hooks for on-ledger accounting and gating, paired with an off-ledger indexer to compute complex distributions (NFT boosts, proportional rewards) and to drive Claim flows.

What’s in Code/
- drippy_hook.c, drippy_hook2.c: PoC hooks that try to tax buys/sells, split fees to pools, pay NFT and token holders, and do anti-sniping.
- batchRewards.js, batchNFTRewards.js, distributeTokens.js: Off-ledger batch distribution concepts.
- addLiquidity*.js, antiSnipingDecoys.js, setupEscrow.js, relockUnused.js, bridgeTokens.js: Liquidity, anti-sniping decoys, locks, and bridging PoCs.

Reality Check (Hooks constraints)
- Hooks are deterministic, resource-limited, and cannot iterate through large holder sets.
- Hooks cannot arbitrarily “query NFT holders” or “enumerate token balances” like off-chain code. Those should live off-ledger.
- Hooks can read/write small key/value state (hook state) and can emit limited internal transactions.
- Good pattern: Hooks route and account for fees/pools; a Claim function allows users to withdraw accruals safely on-chain.

Proposed On-ledger Hooks
1) Fee Router Hook (installed on Issuer/Treasury account)
   - Purpose: Split incoming protocol fee revenue to reward pools (nft_pool, holder_pool, treasury, amm).
   - Trigger: HookOn: Payment to the issuer (TransferRate receipts), or Payment to the router with a memo tag.
   - Inputs (Hook Params):
     - CUR (currency code), ISSUER, TREASURY, NFT_POOL, HOLDER_POOL, AMM_POOL
     - FEE_BPS (e.g., 500 = 5%), ALLOC_NFT, ALLOC_HOLDERS, ALLOC_TREASURY, ALLOC_AMM
     - ANTI_SNIPING_END_EPOCH, WHITELIST_HASH (optional)
   - Behavior:
     - On qualifying incoming funds, split per allocation and Payment-out to target pools using etxn_reserve + emitted txns.
     - Optionally reject SELL-like flows during anti-sniping window only if the issuer/router account is part of the flow.

2) Claim Hook (installed on Rewards Pool account(s))
   - Purpose: Allow users to claim their accrued amounts that were precomputed off-ledger and recorded in hook state.
   - Trigger: Payment of 1 drop (or 0 IOU) with a Memo "CLAIM" to HOLDER_POOL / NFT_POOL.
   - Behavior:
     - Look up claimant’s accrual in hook state (keyed by account), enforce cooldown, emit Payment to claimant, decrement state.
     - Avoid loops: one claimant per txn; distribution is handled off-ledger to prefill state.

Off-ledger Indexer (Backend)
- Watches XRPL/Xahau trades & balances; computes per-account accruals and NFT boosts.
- Pushes accruals (deltas) into Hook State via admin “invoke” txns (small chunks).
- Exposes a REST endpoint so DApp can show pending rewards before claim.
- Optional: Schedules AMM deposits / treasury top-ups.

Network Model
- XRPL for token issuance + transfer rate collection.
- Xahau for Hooks (Fee Router + Claim) and Hook State.
- Bridging (optional) via separate mechanics if you want cross-ledger DRIPPY.

How PoC maps to final design
- Anti-sniping: Hook blocks or taxes transactions when the issuer/router is involved; broader “buy/sell” detection must happen off-ledger.
- NFT + holder rewards: Move calculation off-ledger; on-chain Claim pays out from pools; Hook stores per-account accruals in state.
- AMM/Liquidity: Keep via server scripts (admin ops) and/or a small Hook allocation to AMM_POOL.

Deliverables Plan
1) Hook Specs: define parameters, keys, state format, and HookOn masks.
2) Hook Implementation: C (hook-api) + build pipeline producing wasm bytecode.
3) Deploy Scripts: SetHook tx with parameters, enable on Xahau.
4) Indexer Service: Node worker consuming Xahau/XRPL events, updating accrual state.
5) DApp Integration: pending rewards view, claim button, network switch, error handling.

Hook State Schema (example)
- Namespace: DRIPPY / versioned
- Keys:
  - cfg/… (immutable or admin-only): allocs, addresses, anti-sniping end
  - acc/<20byteAccountHash>: packed struct { u64 nftAccrualDrops; u64 iouAccrual; u32 lastClaimEpoch; }

Security
- Admin-only config changes signed by multisig.
- Strict bounds checks; per-tx limit on emitted transactions.
- Claim idempotency; anti-replay with lastClaimEpoch.

Next Steps
- Confirm target network endpoints (Xahau main/test).
- Provide issuer & pool addresses for params.
- I can scaffold SetHook payloads + a simple indexer worker next.

