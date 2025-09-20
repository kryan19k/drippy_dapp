import React from 'react'
import QRCode from 'react-qr-code'
import { X, QrCode, ExternalLink } from 'lucide-react'

type XummPkce = any

interface Props {
  isOpen: boolean
  onClose: () => void
  xumm: XummPkce | null
  txjson: Record<string, any> | null
  onResolved: (result: { signed: boolean; txid?: string }) => void
}

const XamanSignModal: React.FC<Props> = ({ isOpen, onClose, xumm, txjson, onResolved }) => {
  const [qrUrl, setQrUrl] = React.useState<string | null>(null)
  const [deeplink, setDeeplink] = React.useState<string | null>(null)
  const [, setUuid] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'idle'|'pending'|'signed'|'rejected'|'error'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isOpen) return
    if (!xumm || !txjson) return

    let unsub: undefined | (() => void)
    setStatus('pending')
    setError(null)
    setQrUrl(null)
    setDeeplink(null)
    setUuid(null)

    ;(async () => {
      try {
        const { created, resolved, subscription } = await (xumm as any).payload.createAndSubscribe(
          { txjson },
          (_evt: any) => {}
        )
        setUuid(created?.uuid || null)
        const refs = created?.refs || {}
        setQrUrl(refs.qr_png || refs.qr || refs.qr_matrix || null)
        setDeeplink(refs.deeplink_url || refs.deeplink_web || refs.deeplink_open || refs.open || null)

        unsub = subscription?.unsubscribe || subscription?.cancel

        const outcome = await resolved
        if (outcome?.signed) {
          setStatus('signed')
          const details = await (xumm as any).payload?.get(created.uuid)
          const txid = details?.response?.txid || details?.meta?.hash || undefined
          onResolved({ signed: true, txid })
          onClose()
        } else {
          setStatus('rejected')
          onResolved({ signed: false })
        }
      } catch (e: any) {
        setStatus('error')
        setError(e?.message || 'Failed to create sign request')
      }
    })()

    return () => { try { if (unsub) unsub() } catch {} }
  }, [isOpen, xumm, txjson, onResolved, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Sign With Xaman</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">Scan QR with Xaman or open the link on mobile to sign.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white rounded-xl">
              {qrUrl ? (
                <QRCode value={qrUrl} size={192} />
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
              Open in Xaman
            </a>

            {deeplink && (
              <div className="text-xs text-gray-400 break-all">
                <span className="opacity-70">Share link:</span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 bg-black/30 px-2 py-1 rounded">{deeplink}</code>
                  <a className="text-primary-400 hover:text-primary-300" href={deeplink} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {status === 'rejected' && <div className="text-sm text-yellow-400">Request was rejected</div>}
            {status === 'error' && <div className="text-sm text-red-400">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default XamanSignModal
