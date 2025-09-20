require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { XummSdk } = require('xumm-sdk')
const xrpl = require('xrpl')

// Import admin routes
const adminRoutes = require('./routes/admin')
const hookRoutes = require('./routes/hooks')
const nftRoutes = require('./routes/nft')

const app = express()
app.use(express.json({ limit: '1mb' }))

// Setup CORS for frontend dev origin if provided
const origin = process.env.FRONTEND_ORIGIN || '*'
app.use(cors({ origin, credentials: false }))

// Mount admin routes
app.use('/admin', adminRoutes)
app.use('/api/hooks', hookRoutes)
app.use('/api/nft', nftRoutes)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/xumm-hooks', (req, res) => {
  const sig = req.header('x-xumm-signature') || req.header('x-hub-signature') || req.header('x-signature')
  console.log('[XAMAN WEBHOOK]', {
    headers: req.headers,
    signature: sig,
    body: req.body,
  })
  res.status(200).json({ received: true })
})

// Create a SignIn payload
const createSigninPayload = async () => {
  const key = process.env.XUMM_API_KEY
  const secret = process.env.XUMM_API_SECRET || process.env.XUMM_APIKEY_SECRET
  if (!key || !secret) {
    throw new Error('XUMM configuration missing')
  }
  const xumm = new XummSdk(key, secret)
  const payload = {
    txjson: { TransactionType: 'SignIn' },
    options: {
      submit: false,
      return_url: {
        web: process.env.RETURN_URL_WEB || 'http://localhost:5173',
        app: process.env.RETURN_URL_APP || 'http://localhost:5173'
      },
      custom_meta: {
        identifier: 'drippy-signin',
        instruction: 'Sign in to Drippy',
        blob: { purpose: 'authentication' }
      }
    }
  }
  const response = await xumm.payload.create(payload, true)
  return response
}

app.post('/api/xumm/createpayload', async (_req, res) => {
  try {
    const response = await createSigninPayload()
    return res.json({ payload: response })
  } catch (e) {
    console.error('createpayload error', e)
    return res.status(400).json({ error: 'Failed to create payload' })
  }
})

// Convenience GET endpoint for easier manual testing
app.get('/api/xumm/createpayload', async (_req, res) => {
  try {
    const response = await createSigninPayload()
    return res.json({ payload: response })
  } catch (e) {
    console.error('createpayload (GET) error', e)
    return res.status(400).json({ error: 'Failed to create payload' })
  }
})

// Get payload details
app.get('/api/xumm/getpayload', async (req, res) => {
  try {
    const key = process.env.XUMM_API_KEY
    const secret = process.env.XUMM_API_SECRET || process.env.XUMM_APIKEY_SECRET
    const uuid = req.query.payloadId
    if (!key || !secret) return res.status(500).json({ error: 'XUMM configuration missing' })
    if (!uuid) return res.status(400).json({ error: 'payloadId required' })
    const xumm = new XummSdk(key, secret)
    const details = await xumm.payload.get(uuid)
    return res.json(details)
  } catch (e) {
    console.error('getpayload error', e)
    return res.status(400).json({ error: 'Failed to get payload' })
  }
})

// Create a Claim payload (Payment with Memo: CLAIM) targeting Xahau by default
app.post('/api/xumm/create-claim', async (req, res) => {
  try {
    const key = process.env.XUMM_API_KEY
    const secret = process.env.XUMM_API_SECRET || process.env.XUMM_APIKEY_SECRET
    if (!key || !secret) return res.status(500).json({ error: 'XUMM configuration missing' })
    const claimDest = process.env.HOOK_POOL_ACCOUNT // pool account where Claim hook is installed
    if (!claimDest) return res.status(500).json({ error: 'HOOK_POOL_ACCOUNT missing' })
    const network = (req.body?.network || process.env.XAMAN_NETWORK || 'XAHAU').toUpperCase()

    const xumm = new XummSdk(key, secret)
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Destination: claimDest,
        Amount: '1', // 1 drop just to trigger hook
        Memos: [
          { Memo: { MemoType: Buffer.from('CLAIM').toString('hex').toUpperCase() } }
        ]
      },
      options: {
        submit: false,
        // Some Xaman instances support specifying network in options; if unsupported the user can still pick network in app
        // network: network,
        return_url: {
          web: process.env.RETURN_URL_WEB || 'http://localhost:5173',
          app: process.env.RETURN_URL_APP || 'http://localhost:5173'
        },
        custom_meta: {
          identifier: 'drippy-claim',
          instruction: 'Claim your DRIPPY rewards',
          blob: { network }
        }
      }
    }
    const response = await xumm.payload.create(payload, true)
    return res.json({ payload: response })
  } catch (e) {
    console.error('create-claim error', e)
    return res.status(400).json({ error: 'Failed to create claim payload' })
  }
})

// Admin: push an accrual to Hook state (Payment to hooked account with ACC memos)
app.post('/admin/push-accrual', async (req, res) => {
  try {
    const seed = process.env.HOOK_ADMIN_SEED
    const wss = process.env.XAHAU_WSS || 'wss://xahau.network'
    const dest = process.env.HOOK_POOL_ACCOUNT
    if (!seed || !dest) return res.status(500).json({ error: 'HOOK_ADMIN_SEED or HOOK_POOL_ACCOUNT missing' })
    const { account, drops } = req.body || {}
    if (!account || typeof drops !== 'number') return res.status(400).json({ error: 'account and drops required' })
    const client = new xrpl.Client(wss)
    await client.connect()
    const wallet = xrpl.Wallet.fromSeed(seed)
    const acctHex = Buffer.from(xrpl.decodeAccountID(account)).toString('hex').toUpperCase()
    // format drops as big-endian hex without 0x, max 16 hex chars
    let valHex = BigInt(drops).toString(16).toUpperCase()
    if (valHex.length % 2) valHex = '0' + valHex

    const tx = {
      TransactionType: 'Payment',
      Account: wallet.classicAddress,
      Destination: dest,
      Amount: '1',
      Memos: [
        { Memo: { MemoType: Buffer.from('ACC_A').toString('hex').toUpperCase(), MemoData: acctHex } },
        { Memo: { MemoType: Buffer.from('ACC_V').toString('hex').toUpperCase(), MemoData: valHex } }
      ]
    }
    const prepared = await client.autofill(tx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    await client.disconnect()
    return res.json(result)
  } catch (e) {
    console.error('push-accrual error', e)
    return res.status(400).json({ error: 'Failed to push accrual' })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
