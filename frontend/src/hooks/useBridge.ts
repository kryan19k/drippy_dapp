import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import toast from 'react-hot-toast'
import { useXRPL } from '../contexts/XRPLContext'
import { DRIPPY_TOKEN_ADDRESS, DRIPPY_TOKEN_ABI } from '../../contracts/latest'

// Axelar ITS addresses
const ITS_CONTRACT_TESTNET = '0x3b1ca8B18698409fF95e29c506ad7014980F0193' as `0x${string}`
// const ITS_CONTRACT_MAINNET = '0x5C11c5D6Bf4C81bEe7F4fCE3EDF02c5E2d8F5b0e' as `0x${string}` // Replace with actual mainnet

// Axelar Gateway addresses (XRPL classic addresses)
const GATEWAY_XRPL_TESTNET = 'rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2' // XRPL Testnet Axelar Gateway
// const GATEWAY_XRPL_MAINNET = 'rGateway...' // Replace with actual mainnet

// Token IDs
const DRIPPY_TOKEN_ID_TESTNET = '0x04c6a71be598c63881c4b450b036a4223b83cde33092fcab2428b8a43fe2f52f' as `0x${string}`
// const XRP_TOKEN_ID_TESTNET = '0xba5a21ca88ef6bba2bfff5088994f90e1077e2a1cc3dcc38bd261f00fce2824f'

// ITS Contract ABI (simplified)
const ITS_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "tokenId", "type": "bytes32" },
      { "internalType": "string", "name": "destinationChain", "type": "string" },
      { "internalType": "bytes", "name": "destinationAddress", "type": "bytes" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bytes", "name": "metadata", "type": "bytes" }
    ],
    "name": "interchainTransfer",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const

interface BridgeTransaction {
  id: string
  timestamp: number
  from: string
  to: string
  amount: string
  sourceChain: 'xrpl' | 'evm'
  destinationChain: 'xrpl' | 'evm'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHash?: string
  destinationTxHash?: string
}

/**
 * Hook for DRIPPY cross-chain bridging (XRPL ↔ EVM)
 * Uses Axelar Interchain Token Service (ITS)
 */
export function useBridge() {
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  const xrplContext = useXRPL()
  const { 
    account: xrplAccount, 
    isConnected: xrplConnected, 
    drippyBalance: xrplDrippyBalance,
    hasDrippyTrustline,
    signWithXaman,
    requestDrippyTrustline,
    refreshBalances: refreshXRPL,
  } = xrplContext
  
  console.log('🔍 useBridge - XRPL Context:', {
    account: xrplAccount,
    drippyBalance: xrplDrippyBalance,
    hasDrippyTrustline,
    isConnected: xrplConnected
  })

  const [isBridging, setIsBridging] = useState(false)
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTransaction[]>([])
  const estimatedTime = 60 // seconds
  const bridgeFee = '6' // XRP for gas

  // Read DRIPPY balance on EVM
  const { data: evmDrippyBalance, refetch: refetchEVMBalance } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress && evmConnected,
    }
  })

  // Read ITS allowance
  const { data: itsAllowance, refetch: refetchAllowance } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'allowance',
    args: evmAddress && ITS_CONTRACT_TESTNET ? [evmAddress, ITS_CONTRACT_TESTNET] : undefined,
    query: {
      enabled: !!evmAddress && evmConnected,
    }
  })

  // Write functions
  const { writeContract } = useWriteContract()

  // Load bridge history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('drippy_bridge_history')
    if (stored) {
      try {
        setBridgeHistory(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse bridge history:', e)
      }
    }
  }, [])

  // Save bridge history
  const saveBridgeHistory = (tx: BridgeTransaction) => {
    const updated = [tx, ...bridgeHistory].slice(0, 50) // Keep last 50
    setBridgeHistory(updated)
    localStorage.setItem('drippy_bridge_history', JSON.stringify(updated))
  }

  /**
   * Convert XRPL classic address (r...) to EVM hex address (0x...)
   */
  const xrplToEVM = (rAddress: string): `0x${string}` => {
    try {
      // Use xrpl.js decodeAccountID
      const xrpl = require('xrpl')
      const accountIDBytes = xrpl.decodeAccountID(rAddress)
      return `0x${Buffer.from(accountIDBytes).toString('hex')}` as `0x${string}`
    } catch (error) {
      console.error('Failed to convert XRPL address:', error)
      throw new Error('Invalid XRPL address')
    }
  }

  /**
   * Convert EVM hex address (0x...) to XRPL classic address (r...)
   */
  const evmToXRPL = (hexAddress: `0x${string}`): string => {
    try {
      const xrpl = require('xrpl')
      const noPrefix = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress
      const accountIDBytes = Buffer.from(noPrefix, 'hex')
      return xrpl.encodeAccountID(accountIDBytes)
    } catch (error) {
      console.error('Failed to convert EVM address:', error)
      throw new Error('Invalid EVM address')
    }
  }

  /**
   * Approve ITS contract to spend DRIPPY (required before EVM→XRPL bridge)
   */
  const approveITS = async (amount: string) => {
    if (!evmConnected || !evmAddress) {
      toast.error('Please connect your EVM wallet')
      return false
    }

    try {
      const amountWei = parseUnits(amount, 18)

      console.log('🔓 Approving ITS contract:', {
        spender: ITS_CONTRACT_TESTNET,
        amount,
        amountWei: amountWei.toString()
      })

      writeContract({
        address: DRIPPY_TOKEN_ADDRESS,
        abi: DRIPPY_TOKEN_ABI,
        functionName: 'approve',
        args: [ITS_CONTRACT_TESTNET, amountWei],
      })

      toast.success('Approval transaction submitted!')
      return true
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error?.shortMessage || error?.message || 'Approval failed')
      return false
    }
  }

  /**
   * Bridge DRIPPY from EVM → XRPL
   * Uses Axelar ITS interchainTransfer function
   */
  const bridgeEVMToXRPL = async (amount: string, destinationXRPLAddress: string) => {
    if (!evmConnected || !evmAddress) {
      toast.error('Please connect your EVM wallet')
      return false
    }

    if (!destinationXRPLAddress || !destinationXRPLAddress.startsWith('r')) {
      toast.error('Invalid XRPL destination address')
      return false
    }

    try {
      setIsBridging(true)
      const amountWei = parseUnits(amount, 18)

      // Check allowance
      const currentAllowance = (itsAllowance as bigint) || 0n
      if (currentAllowance < amountWei) {
        toast.error('Please approve ITS contract first')
        setIsBridging(false)
        return false
      }

      // Convert XRPL address to hex for Axelar
      const destinationHex = xrplToEVM(destinationXRPLAddress)

      console.log('🌉 Bridging EVM → XRPL:', {
        amount,
        amountWei: amountWei.toString(),
        destinationXRPL: destinationXRPLAddress,
        destinationHex,
        itsContract: ITS_CONTRACT_TESTNET
      })

      // Call ITS interchainTransfer
      writeContract({
        address: ITS_CONTRACT_TESTNET,
        abi: ITS_ABI,
        functionName: 'interchainTransfer',
        args: [
          DRIPPY_TOKEN_ID_TESTNET as `0x${string}`, // tokenId (needs to be registered first)
          'xrpl', // destinationChain
          destinationHex, // destinationAddress (as hex)
          amountWei, // amount
          '0x' as `0x${string}`, // metadata (empty)
        ],
        value: parseUnits(bridgeFee, 18), // Gas fee in native token
      })

      // Save to history
      const tx: BridgeTransaction = {
        id: `${Date.now()}-evm-xrpl`,
        timestamp: Date.now(),
        from: evmAddress,
        to: destinationXRPLAddress,
        amount,
        sourceChain: 'evm',
        destinationChain: 'xrpl',
        status: 'pending',
      }
      saveBridgeHistory(tx)

      toast.success('Bridge transaction submitted! Wait 1-2 minutes for completion.')
      return true
    } catch (error: any) {
      console.error('Bridge error:', error)
      toast.error(error?.shortMessage || error?.message || 'Bridge failed')
      return false
    } finally {
      setIsBridging(false)
    }
  }

  /**
   * Bridge DRIPPY from XRPL → EVM
   * Sends payment to Axelar Gateway with EVM address in memo
   */
  const bridgeXRPLToEVM = async (amount: string, destinationEVMAddress: `0x${string}`) => {
    if (!xrplConnected || !xrplAccount) {
      toast.error('Please connect your XRPL wallet')
      return false
    }

    if (!destinationEVMAddress || !destinationEVMAddress.startsWith('0x')) {
      toast.error('Invalid EVM destination address')
      return false
    }

    try {
      setIsBridging(true)

      const drippyIssuer = import.meta.env.VITE_DRIPPY_ISSUER as string
      const drippyCurrency = import.meta.env.VITE_DRIPPY_CURRENCY as string

      if (!drippyIssuer || !drippyCurrency) {
        toast.error('DRIPPY issuer/currency not configured')
        setIsBridging(false)
        return false
      }

      console.log('🌉 Bridging XRPL → EVM:', {
        amount,
        destinationEVM: destinationEVMAddress,
        gateway: GATEWAY_XRPL_TESTNET
      })

      // Create payment transaction to Axelar Gateway
      const payment = {
        TransactionType: 'Payment',
        Account: xrplAccount,
        Destination: GATEWAY_XRPL_TESTNET,
        Amount: {
          currency: drippyCurrency,
          issuer: drippyIssuer,
          value: amount
        },
        Memos: [
          {
            Memo: {
              // Memo type: Destination chain
              MemoType: Buffer.from('destinationChain', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from('xrpl-evm', 'utf8').toString('hex').toUpperCase()
            }
          },
          {
            Memo: {
              // Memo type: Destination address
              MemoType: Buffer.from('destinationAddress', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(destinationEVMAddress.toLowerCase(), 'utf8').toString('hex').toUpperCase()
            }
          }
        ]
      }

      // Sign with Xaman
      const result = await signWithXaman(payment)

      if (result.signed) {
        // Save to history
        const tx: BridgeTransaction = {
          id: `${Date.now()}-xrpl-evm`,
          timestamp: Date.now(),
          from: xrplAccount,
          to: destinationEVMAddress,
          amount,
          sourceChain: 'xrpl',
          destinationChain: 'evm',
          status: 'pending',
          txHash: result.txid
        }
        saveBridgeHistory(tx)

        toast.success('Bridge transaction signed! Wait 1-2 minutes for tokens to arrive.')
        
        // Refresh balances after a delay
        setTimeout(() => {
          refreshXRPL()
          refetchEVMBalance()
        }, 5000)

        return true
      } else {
        toast.error('Transaction was rejected')
        return false
      }
    } catch (error: any) {
      console.error('Bridge error:', error)
      toast.error(error?.message || 'Bridge failed')
      return false
    } finally {
      setIsBridging(false)
    }
  }

  // Format balances for display
  const formattedEVMBalance = evmDrippyBalance ? formatUnits(evmDrippyBalance as bigint, 18) : '0'
  const formattedXRPLBalance = xrplDrippyBalance || '0'

  return {
    // Connection states
    evmConnected,
    xrplConnected,
    evmAddress,
    xrplAccount,
    
    // Balances
    evmDrippyBalance: formattedEVMBalance,
    xrplDrippyBalance: formattedXRPLBalance,
    hasDrippyTrustline,
    
    // Bridge functions
    bridgeEVMToXRPL,
    bridgeXRPLToEVM,
    approveITS,
    requestDrippyTrustline,
    
    // Utilities
    xrplToEVM,
    evmToXRPL,
    
    // State
    isBridging,
    itsAllowance: itsAllowance ? formatUnits(itsAllowance as bigint, 18) : '0',
    bridgeHistory,
    estimatedTime,
    bridgeFee,
    
    // Refresh
    refetchBalances: () => {
      refreshXRPL()
      refetchEVMBalance()
      refetchAllowance()
    }
  }
}

