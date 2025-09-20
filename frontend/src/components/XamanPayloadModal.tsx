import React from 'react'
import QRCode from 'react-qr-code'
import { X, QrCode } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  endpoint: string
  body?: any
  onResolved?: (result: any) => void
}

const XamanPayloadModal: React.FC<Props> = ({ isOpen, onClose, endpoint, body, onResolved }) => {
  const [qrPng, setQrPng] = React.useState<string | null>(null)
  const [deeplink, setDeeplink] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ws, setWs] = React.useState<WebSocket | null>(null)

  React.useEffect(() => {
    if (!isOpen) {
      setQrPng(null); setDeeplink(null); setError(null); setLoading(false)
      try { ws?.close() } catch {}
      return
    }
    const run = async () => {
      setLoading(true); setError(null)
      try {
        const base = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8787'
        const resp = await fetch(`${base}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        })
        if (!resp.ok) throw new Error(`POST ${endpoint} failed: ${resp.status}`)
        const data = await resp.json()
        const payload = data?.payload || data
        const refs = payload?.refs || {}
        const next = payload?.next || {}
        setQrPng(refs.qr_png || null)
        setDeeplink(next.always || refs.deeplink_url || refs.open || null)
        const wsUrl = refs.websocket_status
        if (wsUrl) {
          const socket = new WebSocket(wsUrl)
          socket.onmessage = async (e) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg?.signed !== undefined) {
                onResolved?.(msg)
                if (msg.signed) onClose()
                socket.close()
              }
            } catch {}
          }
          socket.onerror = () => { try { socket.close() } catch {} }
          setWs(socket)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create payload')
      } finally {
        setLoading(false)
      }
    }
    void run()
    return () => { try { ws?.close() } catch {} }
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Approve in Xaman</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center">
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
        </div>
        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
      </div>
    </div>
  )
}

export default XamanPayloadModal

