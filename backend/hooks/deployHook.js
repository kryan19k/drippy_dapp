// Minimal SetHook submitter (Xahau)
const fs = require('fs')
const path = require('path')
const xrpl = require('xrpl')

async function main() {
  const ws = process.env.XAHAU_WSS || 'wss://xahau.network'
  const seed = process.env.HOOK_ADMIN_SEED
  if (!seed) throw new Error('HOOK_ADMIN_SEED missing')
  const client = new xrpl.Client(ws)
  await client.connect()
  const wallet = xrpl.Wallet.fromSeed(seed)

  const setHook = require('./sethook.example.json')
  // Inject bytecode into CreateCode if provided via env var
  const codeFile = process.env.HOOK_BYTECODE_FILE
    ? path.resolve(process.cwd(), process.env.HOOK_BYTECODE_FILE)
    : null
  if (codeFile) {
    const hex = fs.readFileSync(codeFile, 'utf8').trim()
    if (!/^[0-9A-Fa-f]+$/.test(hex)) throw new Error('HOOK_BYTECODE_FILE must contain base16 only')
    if (!setHook.Hooks || !setHook.Hooks[0] || !setHook.Hooks[0].Hook) throw new Error('Invalid sethook json structure')
    setHook.Hooks[0].Hook.CreateCode = hex.toUpperCase()
  }
  setHook.Account = wallet.classicAddress

  const prepared = await client.autofill(setHook)
  const signed = wallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)
  console.log(result)
  await client.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
