import React from 'react'
import QRCode from 'react-qr-code'
import { X, Smartphone, QrCode, ExternalLink } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAuthorized: (account: string) => void
}

const XamanConnectModal: React.FC<Props> = ({ isOpen, onClose, onAuthorized }) => {
  const [qrPng, setQrPng] = React.useState<string | null>(null)
  const [deeplink, setDeeplink] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ws, setWs] = React.useState<WebSocket | null>(null)

  React.useEffect(() => {
    if (!isOpen) {
      setQrPng(null)
      setDeeplink(null)
      setError(null)
      setLoading(false)
      try { ws?.close() } catch {}
      return
    }

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const base = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8787'
        const resp = await fetch(`${base}/api/xumm/createpayload`, { method: 'POST' })
        if (!resp.ok) throw new Error(`Create payload failed: ${resp.status}`)
        const data = await resp.json()
        const payload = data?.payload || data
        const refs = payload?.refs || {}
        const next = payload?.next || {}
        const wsUrl = refs.websocket_status
        setQrPng(refs.qr_png || null)
        setDeeplink(next.always || refs.deeplink_url || refs.open || null)

        if (wsUrl) {
          const socket = new WebSocket(wsUrl)
          socket.onmessage = async (e) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg?.signed) {
                const status = await fetch(`${base}/api/xumm/getpayload?payloadId=${msg.payload_uuidv4}`)
                if (status.ok) {
                  const details = await status.json()
                  const acct = details?.response?.account
                  if (acct) onAuthorized(acct)
                  onClose()
                }
                socket.close()
              }
            } catch {}
          }
          socket.onerror = () => { try { socket.close() } catch {} }
          setWs(socket)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start Xaman authorization')
      } finally {
        setLoading(false)
      }
    }

    void init()
    return () => { try { ws?.close() } catch {} }
  }, [isOpen, onAuthorized, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Connect Xaman Wallet</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-400">
          Scan the QR with your Xaman app, or open the link on mobile.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white rounded-xl">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center text-gray-600">Loading…</div>
              ) : qrPng ? (
                <img src={qrPng} alt="Xaman QR" className="w-48 h-48" />
              ) : deeplink ? (
                <QRCode value={deeplink} size={192} />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                  <QrCode className="w-10 h-10" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">Scan with Xaman</span>
          </div>

          <div className="space-y-3">
            <a
              href={deeplink ?? '#'}
              onClick={(e) => { if (!deeplink) e.preventDefault() }}
              className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${deeplink ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Open in Xaman (Mobile)
            </a>

            {deeplink && (
              <div className="text-xs text-gray-400 break-all">
                <span className="opacity-70">Or share link:</span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 bg-black/30 px-2 py-1 rounded">{deeplink}</code>
                  <a className="text-primary-400 hover:text-primary-300" href={deeplink} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default XamanConnectModal

