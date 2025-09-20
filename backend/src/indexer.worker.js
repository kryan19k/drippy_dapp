// Minimal indexer skeleton: periodically pushes mock accruals to Hook state on Xahau
require('dotenv').config()
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

async function pushAccrual(account, drops){
  const base = process.env.API_BASE || 'http://localhost:8787'
  const res = await fetch(`${base}/admin/push-accrual`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ account, drops })
  })
  if(!res.ok){
    const txt = await res.text(); throw new Error(`push-accrual failed: ${res.status} ${txt}`)
  }
  return res.json()
}

async function main(){
  const testAccount = process.env.TEST_ACCOUNT // r...
  if(!testAccount){
    console.log('Set TEST_ACCOUNT in backend/.env to push mock accruals')
    return
  }
  while(true){
    try{
      const amt = Math.floor(Math.random()*1000) + 100 // 100-1100 drops
      console.log('Pushing accrual', amt, 'to', testAccount)
      await pushAccrual(testAccount, amt)
    }catch(e){ console.error(e) }
    await sleep(15000)
  }
}

main().catch(e=>{console.error(e); process.exit(1)})

