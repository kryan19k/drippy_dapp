XRPL/Xahau Hooks Setup Guide

Summary
- We will deploy Hooks on Xahau (the Hooks-enabled XRPL sidechain). XRPL mainnet does not have Hooks yet; Xahau does and is production-ready for Hook use-cases.
- Flow: write Hook C → compile to Wasm (base16) → SetHook tx installs code → verify → iterate.

Prereqs
- Node 18+
- A funded Xahau account to deploy from (admin): set HOOK_ADMIN_SEED in backend/.env
- Xahau WebSocket: set XAHAU_WSS in backend/.env (default: wss://xahau.network)
- Hook bytecode (base16-encoded Wasm) produced by the Hooks toolchain

Tooling to compile the Hook
- Official docs: https://xrpl-hooks.readme.io/docs/introduction
- Easiest path is the Docker toolchain from the Hooks repo (build container that produces .wasm & .wasm.hex):
  1) Install Docker Desktop
  2) Clone hooks repo (or template) that includes hook-api headers and Makefile
  3) Place your C file (e.g., drippy_claim_hook.c) and run `make`
  4) Grab the base16 hex output (e.g., build/drippy_claim_hook.wasm.hex)

Deploying a Hook (this repo)
1) Put your base16 bytecode into a file, e.g., backend/hooks/code.hex
2) Fill backend/hooks/sethook.example.json:
   - HookOn: mask for which tx types trigger (e.g., only ttPAYMENT). For testing, F’s mask triggers on all.
   - HookNamespace: any unique 32-byte hex for namespacing state/params (keep stable per app)
   - HookParameters: supply addresses and config in hex (see encode helpers below)
3) Run: `HOOK_BYTECODE_FILE=hooks/code.hex npm run deploy:hook`
   - This reads code.hex and injects into CreateCode, then signs SetHook using HOOK_ADMIN_SEED

Utilities
- Encode an Account (r...) to hex: `node hooks/util/encodeAddress.js r...`
- Encode ASCII (like currency code) to hex: `node hooks/util/encodeAscii.js DRIPPY`

Recommended first Hook
- Claim Hook: on Payment (1 drop) with Memo `CLAIM`, reads claimant accrual from Hook state and emits Payment to caller, updates state.
- Fee Router Hook: receives protocol fee, splits to pools via emitted Payments.

Validate
- After deploy, query account_objects for Hooks to verify installation.
- Send a small Payment with the expected Memo to the hooked account; observe traces and effect.

