// Build a SetHook JSON from environment variables and write hooks/sethook.generated.json
// Required env:
//   ADMIN_ACCOUNT=r...
//   CUR_ASCII=DRIPPY (<=20 chars)
//   ISSUER_ACCOUNT=r...
//   MAXP=1000000 (drops)
//   COOLD=60 (seconds)
//   HOOK_NAMESPACE_ASCII=DRIPPY:CLAIM:v1 (optional; will be padded to 32 bytes)
//   HOOK_BYTECODE_FILE=hooks/build/drippy_claim_hook.wasm.hex (optional; only for convenience)
// Notes: This script enforces sizes expected by the hook:
//   ADMIN, ISSUER, CUR => 20 bytes
//   MAXP, COOLD        => 8 bytes

const fs = require('fs')
const path = require('path')
const xrpl = require('xrpl')

function toHex(buf){ return Buffer.from(buf).toString('hex').toUpperCase() }
function fromAddress20(addr){ return xrpl.decodeAccountID(addr) } // Buffer 20
function asciiTo20(s){
  const b = Buffer.from(String(s||''), 'utf8')
  if (b.length > 20) throw new Error('CUR_ASCII longer than 20 bytes')
  return Buffer.concat([b, Buffer.alloc(20 - b.length)])
}
function u64ToBE(n){
  const v = BigInt(n)
  const out = Buffer.alloc(8)
  out.writeBigUInt64BE(v)
  return out
}
function ns32FromAscii(s){
  const b = Buffer.from(String(s||'DRIPPY:CLAIM:v1'), 'utf8')
  if (b.length > 32) throw new Error('HOOK_NAMESPACE_ASCII longer than 32 bytes')
  return Buffer.concat([b, Buffer.alloc(32 - b.length)])
}

function param(name, valueHex){
  return { HookParameter: { HookParameterName: toHex(Buffer.from(name,'utf8')), HookParameterValue: valueHex } }
}

function main(){
  const admin = process.env.ADMIN_ACCOUNT
  const issuer = process.env.ISSUER_ACCOUNT
  const curAscii = process.env.CUR_ASCII
  const maxp = process.env.MAXP || '0'
  const coold = process.env.COOLD || '0'
  if (!admin || !issuer || !curAscii) {
    throw new Error('Set ADMIN_ACCOUNT, ISSUER_ACCOUNT, CUR_ASCII env vars')
  }
  const admin20 = fromAddress20(admin)
  const issuer20 = fromAddress20(issuer)
  const cur20 = asciiTo20(curAscii)
  const maxp8 = u64ToBE(maxp)
  const coold8 = u64ToBE(coold)

  const namespace = ns32FromAscii(process.env.HOOK_NAMESPACE_ASCII)

  const setHook = {
    TransactionType: 'SetHook',
    Account: 'rISSUER_OR_ROUTER_ACCOUNT',
    Hooks: [
      {
        Hook: {
          CreateCode: '<BASE16_HOOK_BYTECODE>',
          HookOn: '0000000000000000000000000000000000000000000000000000000000000001', // ttPAYMENT only
          HookNamespace: toHex(namespace),
          HookParameters: [
            param('ADMIN', toHex(admin20)),
            param('CUR', toHex(cur20)),
            param('ISSUER', toHex(issuer20)),
            param('MAXP', toHex(maxp8)),
            param('COOLD', toHex(coold8))
          ]
        }
      }
    ]
  }

  const bytecodeFile = process.env.HOOK_BYTECODE_FILE
  if (bytecodeFile && fs.existsSync(bytecodeFile)) {
    const hex = fs.readFileSync(bytecodeFile,'utf8').trim()
    if (/^[0-9A-Fa-f]+$/.test(hex)) setHook.Hooks[0].Hook.CreateCode = hex.toUpperCase()
  }

  const outPath = path.resolve(__dirname, 'sethook.generated.json')
  fs.writeFileSync(outPath, JSON.stringify(setHook, null, 2))
  console.log('Wrote', outPath)
}

try { main() } catch (e) { console.error(e.message || e); process.exit(1) }

