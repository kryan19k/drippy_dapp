// Minimal AMM watcher skeleton for Xahau: subscribes to transactions, estimates volume contribution,
// and pushes small accruals to the Claim Hook via the admin endpoint.
require('dotenv').config()
const xrpl = require('xrpl')
const { getBalanceChanges } = xrpl
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function pushAccrual(account, drops){
  const base = process.env.API_BASE || 'http://localhost:8787'
  const res = await fetch(`${base}/admin/push-accrual`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ account, drops })
  })
  if(!res.ok){ console.error('push-accrual failed', res.status); return }
  console.log('accrual ->', account, drops)
}

function pickBeneficiaryFromTx(tx){
  // Simple heuristic: reward the initiating Account
  return tx?.Account
}

function estimateDropsFromMeta(meta){
  if (!meta) return 0
  let total = 0
  try {
    const balances = getBalanceChanges(meta)
    for (const acct of balances) {
      for (const ch of acct.balances) {
        if (ch.currency === 'XRP') {
          total += Math.abs(parseFloat(ch.value)) * 1_000_000 // to drops
        }
      }
    }
  } catch {}
  return Math.floor(total)
}

async function main(){
  const wss = process.env.XAHAU_WSS || 'wss://xahau.network'
  const client = new xrpl.Client(wss)
  await client.connect()
  await client.request({ command: 'subscribe', streams: ['transactions'] })
  console.log('Subscribed to transactions on', wss)

  client.on('transaction', async (ev) => {
    try {
      const tx = ev.transaction
      const meta = ev.meta
      if (!tx || !meta) return
      // Focus on AMM-related or high-volume payments; refine as needed
      const t = tx.TransactionType
      if (t !== 'AMMDeposit' && t !== 'AMMWithdraw' && t !== 'Payment') return

      const drops = estimateDropsFromMeta(meta)
      if (!drops || drops <= 0) return
      const beneficiary = pickBeneficiaryFromTx(tx)
      if (!beneficiary) return

      const scaled = Math.max(1, Math.floor(drops * 0.0001)) // 0.01% accrual as a placeholder
      await pushAccrual(beneficiary, scaled)
    } catch (e) {
      console.error('tx handler error', e)
    }
  })
}

main().catch(e=>{console.error(e); process.exit(1)})
