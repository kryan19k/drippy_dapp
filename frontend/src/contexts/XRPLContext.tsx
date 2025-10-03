import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { Client } from 'xrpl'
import { XummPkce } from 'xumm-oauth2-pkce'

interface XRPLContextType {
  client: Client | null
  isConnected: boolean
  account: string | null
  balance: string | null
  drippyBalance: string | null
  hasDrippyTrustline: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalances: () => Promise<void>
  // Xaman auth/modal state
  isAuthReady: boolean
  openConnectModal: () => void
  closeConnectModal: () => void
  isConnectModalOpen: boolean
  xumm: XummPkce | null
  handleXummAuthorized: (account: string) => Promise<void>
  // Signing helpers
  signWithXaman: (txjson: Record<string, any>) => Promise<{ signed: boolean; txid?: string }>
  requestDrippyTrustline: () => Promise<{ signed: boolean; txid?: string }>
  getTrustSetDetectLink: () => string | null
}

const XRPLContext = createContext<XRPLContextType | undefined>(undefined)

export const useXRPL = () => {
  const context = useContext(XRPLContext)
  if (context === undefined) {
    throw new Error('useXRPL must be used within an XRPLProvider')
  }
  return context
}

interface XRPLProviderProps {
  children: ReactNode
}

export const XRPLProvider: React.FC<XRPLProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [drippyBalance, setDrippyBalance] = useState<string | null>(null)
  const [hasDrippyTrustline, setHasDrippyTrustline] = useState(false)
  const [xumm, setXumm] = useState<XummPkce | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  useEffect(() => {
    // Initialize XRPL client
    const initializeClient = async () => {
      try {
        // Use testnet for development/testing
        const wsUrl = import.meta.env.VITE_XRPL_TESTNET 
          ? 'wss://s.altnet.rippletest.net:51233' 
          : 'wss://xrplcluster.com/'
        
        console.log('🌐 Connecting to XRPL:', wsUrl)
        
        const client = new Client(wsUrl)
        await client.connect()
        setClient(client)
        console.log('✅ XRPL client connected to:', wsUrl)
      } catch (error) {
        console.error('Failed to connect to XRPL:', error)
      }
    }

    initializeClient()

    return () => {
      if (client) {
        client.disconnect()
      }
    }
  }, [])

  // Initialize Xaman OAuth2 PKCE
  useEffect(() => {
    const appKey = import.meta.env.VITE_XUMM_APP_KEY as string | undefined
    if (!appKey) {
      console.warn('VITE_XUMM_APP_KEY missing: Xaman connect disabled')
      setIsAuthReady(false)
      return
    }
    
    console.log('🔐 Initializing Xaman OAuth...')
    
    const instance = new XummPkce(appKey, {
      redirectUrl: window.location.origin,
      storage: localStorage,
    })
    setXumm(instance)
    
    ;(async () => {
      try {
        console.log('🔍 Checking Xaman auth state...')
        const state = await instance.state()
        console.log('Xaman state:', state)
        
        const acct = (state as any)?.me?.account || (state as any)?.me?.sub || null
        if (acct) {
          console.log('✅ Xaman auto-login:', acct)
          setAccount(acct)
          setIsConnected(true)
          setTimeout(() => { void refreshBalances() }, 250)
        } else {
          console.log('ℹ️ No existing Xaman session')
        }
      } catch (error) {
        console.error('❌ Xaman auth check failed:', error)
      }
      setIsAuthReady(true)
    })()
  }, [])

  const connectWallet = async () => {
    setIsConnectModalOpen(true)
  }

  const disconnectWallet = () => {
    try { (xumm as any)?.logout?.(); (xumm as any)?.forgetMe?.() } catch {}
    setAccount(null)
    setIsConnected(false)
    setBalance(null)
    setDrippyBalance(null)
  }

  const refreshBalances = async () => {
    if (!client || !account) return

    try {
      // Get XRP balance
      const accountInfo = await client.request({
        command: 'account_info',
        account: account
      })

      if (accountInfo.result?.account_data) {
        const xrpBalance = accountInfo.result.account_data.Balance
        setBalance((parseInt(xrpBalance) / 1000000).toString()) // Convert drops to XRP
      }

      // Get DRIPPY issued currency balance via account_lines
      const issuer = import.meta.env.VITE_DRIPPY_ISSUER as string | undefined
      const currency = import.meta.env.VITE_DRIPPY_CURRENCY as string | undefined
      
      console.log('📊 Environment Config:', {
        issuer: import.meta.env.VITE_DRIPPY_ISSUER,
        currency: import.meta.env.VITE_DRIPPY_CURRENCY,
        testnet: import.meta.env.VITE_XRPL_TESTNET
      })
      
      if (issuer && currency) {
        // Convert to hex and pad to 40 chars (20 bytes) - same as backend
        const toHex = (s: string) => Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().padEnd(40, '0')
        const targetAlpha = currency
        const targetHex = currency.length > 3 ? toHex(currency) : undefined
        
        console.log('🔍 Checking for DRIPPY trustline:', { issuer, currency, targetAlpha, targetHex })
        
        const linesResp: any = await client.request({
          command: 'account_lines',
          account,
          ledger_index: 'validated'
        } as any)
        const lines = (linesResp.result?.lines || []) as Array<any>
        
        console.log('📋 Account lines (FULL):', lines)
        console.log('📋 Account lines (SIMPLE):', lines.map(l => ({ currency: l.currency, account: l.account, balance: l.balance })))
        
        // Check each line individually
        lines.forEach((line, index) => {
          const cur = (line.currency || '').toUpperCase()
          const peer = (line.account || line.issuer || '').trim()
          const matchesIssuer = peer === issuer
          const matchesCurrency = (cur === targetAlpha.toUpperCase() || (targetHex && cur === targetHex))
          
          console.log(`Line ${index}:`, {
            currency: cur,
            account: peer,
            balance: line.balance,
            matchesIssuer,
            matchesCurrency,
            isMatch: matchesIssuer && matchesCurrency
          })
        })
        
        const match = lines.find(l => {
          const cur = (l.currency || '').toUpperCase()
          const peer = (l.account || l.issuer || '').trim()
          return peer === issuer && (cur === targetAlpha.toUpperCase() || (targetHex && cur === targetHex))
        })
        
        if (match) {
          console.log('✅ DRIPPY trustline found!', match)
          setHasDrippyTrustline(true)
          const bal = match.balance ?? '0'
          console.log('💰 Setting DRIPPY balance to:', bal)
          setDrippyBalance(bal)
        } else {
          console.log('❌ DRIPPY trustline not found')
          console.log('Expected issuer:', issuer)
          console.log('Expected currency (alpha):', targetAlpha)
          console.log('Expected currency (hex):', targetHex)
          setHasDrippyTrustline(false)
          setDrippyBalance(null)
        }
      } else {
        console.warn('⚠️ Missing issuer or currency in env:', { issuer, currency })
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }

  // Signing via Xaman SDK (client-side through OAuth)
  const signWithXaman = async (txjson: Record<string, any>) => {
    if (!xumm) throw new Error('Xaman not initialized')
    const { created, resolved } = await (xumm as any).payload.createAndSubscribe(
      { txjson },
      (_event: any) => {}
    )
    try { sessionStorage.setItem('last_xumm_payload_uuid', created?.uuid || '') } catch {}
    const outcome = await resolved
    if (outcome?.signed) {
      const details = await (xumm as any).payload?.get(created.uuid)
      const txid = details?.response?.txid || details?.meta?.hash || undefined
      return { signed: true, txid }
    }
    return { signed: false }
  }

  const requestDrippyTrustline = async () => {
    const issuer = import.meta.env.VITE_DRIPPY_ISSUER as string
    const currency = import.meta.env.VITE_DRIPPY_CURRENCY as string
    const limit = (import.meta.env.VITE_DRIPPY_TRUSTLINE_LIMIT as string) || '1000000000'
    if (!issuer || !currency) throw new Error('Missing DRIPPY issuer or currency env vars')
    const txjson: any = {
      TransactionType: 'TrustSet',
      Account: account || undefined,
      LimitAmount: {
        currency,
        issuer,
        value: limit,
      },
    }
    return signWithXaman(txjson)
  }

  const getTrustSetDetectLink = () => {
    const issuer = import.meta.env.VITE_DRIPPY_ISSUER as string
    const currency = import.meta.env.VITE_DRIPPY_CURRENCY as string
    const limit = (import.meta.env.VITE_DRIPPY_TRUSTLINE_LIMIT as string) || '1000000000'
    if (!issuer || !currency) return null
    // If currency > 3 chars, use HEX per Xaman docs; else use alpha code
    const toHex = (s: string) => Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    const cur = currency.length > 3 ? toHex(currency) : currency
    const tx = {
      TransactionType: 'TrustSet',
      Flags: 131072,
      LimitAmount: { currency: cur, issuer, value: limit }
    }
    const str = JSON.stringify(tx)
    const hex = Array.from(new TextEncoder().encode(str)).map(b => b.toString(16).padStart(2, '0')).join('')
    return `https://xaman.app/detect/${hex}`
  }

  const value: XRPLContextType = {
    client,
    isConnected,
    account,
    balance,
    drippyBalance,
    hasDrippyTrustline,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    // modal/auth state
    isAuthReady,
    openConnectModal: () => setIsConnectModalOpen(true),
    closeConnectModal: () => setIsConnectModalOpen(false),
    isConnectModalOpen,
    xumm,
    handleXummAuthorized: async (acct: string) => {
      setAccount(acct)
      setIsConnected(true)
      setIsConnectModalOpen(false)
      await refreshBalances()
    },
    signWithXaman,
    requestDrippyTrustline,
    getTrustSetDetectLink,
  }

  return (
    <XRPLContext.Provider value={value}>
      {children}
    </XRPLContext.Provider>
  )
}
