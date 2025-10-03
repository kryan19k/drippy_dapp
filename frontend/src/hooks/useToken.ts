import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import toast from 'react-hot-toast'
import { 
  DRIPPY_TOKEN_ADDRESS, 
  DRIPPY_TOKEN_ABI 
} from '../../contracts/latest'

/**
 * Hook for interacting with DRIPPY token contract
 * Provides balance, approval, transfer, and token info functions
 */
export function useToken(): {
  address: `0x${string}` | undefined
  isConnected: boolean
  chainId: number | undefined
  balance: string
  balanceRaw: bigint | undefined
  tokenInfo: {
    totalSupply: string
    maxSupply: string
    circulatingSupply: string
    normalTax: number
    antiSnipeTax: number
    antiSnipeActive: boolean
    accumulatedFees: string
  } | null
  isApproving: boolean
  isTransferring: boolean
  transactionSuccess: boolean | undefined
  approve: (spender: `0x${string}`, amount: string) => Promise<void>
  transfer: (to: `0x${string}`, amount: string) => Promise<boolean>
  getAllowance: (spender: `0x${string}`) => any
  refetchBalance: () => void
} {
  const { address, isConnected, chainId } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  // Read token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  })

  // Read token info
  const { data: tokenInfo } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'getTokenInfo',
  })

  // Read allowance
  const getAllowance = (spender: `0x${string}`) => {
    return useReadContract({
      address: DRIPPY_TOKEN_ADDRESS,
      abi: DRIPPY_TOKEN_ABI,
      functionName: 'allowance',
      args: address && spender ? [address, spender] : undefined,
      query: {
        enabled: !!address && !!spender && isConnected,
      }
    })
  }

  // Write functions
  const { writeContract, data: hash } = useWriteContract()
  const { isSuccess, isLoading: isMining } = useWaitForTransactionReceipt({ hash })

  // Approve spending
  const approve = async (spender: `0x${string}`, amount: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsApproving(true)
      const amountWei = parseUnits(amount, 18)

      writeContract({
        address: DRIPPY_TOKEN_ADDRESS,
        abi: DRIPPY_TOKEN_ABI,
        functionName: 'approve',
        args: [spender, amountWei],
      })

      toast.success('Approval transaction submitted!')
    } catch (error: any) {
      console.error('Approve error:', error)
      toast.error(error?.message || 'Approval failed')
    } finally {
      setIsApproving(false)
    }
  }

  // Transfer tokens
  const transfer = async (to: `0x${string}`, amount: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return false
    }

    try {
      setIsTransferring(true)
      const amountWei = parseUnits(amount, 18)

      console.log('🚀 Initiating transfer:')
      console.log('  To:', to)
      console.log('  Amount:', amount, 'DRIPPY')
      console.log('  Amount (Wei):', amountWei.toString())
      console.log('  Contract:', DRIPPY_TOKEN_ADDRESS)
      console.log('  Chain ID:', chainId)

      writeContract({
        address: DRIPPY_TOKEN_ADDRESS,
        abi: DRIPPY_TOKEN_ABI,
        functionName: 'transfer',
        args: [to, amountWei],
        gas: 100000n, // Explicit gas limit for token transfer
      })

      toast.success('Transfer transaction submitted!')
      return true
    } catch (error: any) {
      console.error('Transfer error:', error)
      
      // More detailed error logging
      if (error.message) {
        console.error('Error message:', error.message)
      }
      if (error.cause) {
        console.error('Error cause:', error.cause)
      }
      if (error.details) {
        console.error('Error details:', error.details)
      }
      
      toast.error(error?.shortMessage || error?.message || 'Transfer failed')
      return false
    } finally {
      setIsTransferring(false)
    }
  }

  // Format balance for display
  const formattedBalance = balance ? formatUnits(balance as bigint, 18) : '0'

  // Parse token info
  const parsedTokenInfo = tokenInfo ? {
    totalSupply: formatUnits((tokenInfo as any)[0], 18),
    maxSupply: formatUnits((tokenInfo as any)[1], 18),
    circulatingSupply: formatUnits((tokenInfo as any)[2], 18),
    normalTax: Number((tokenInfo as any)[3]) / 100, // Convert bps to percentage
    antiSnipeTax: Number((tokenInfo as any)[4]) / 100,
    antiSnipeActive: (tokenInfo as any)[5] as boolean,
    accumulatedFees: formatUnits((tokenInfo as any)[6], 18),
  } : null

  return {
    // State
    address,
    isConnected,
    chainId,
    balance: formattedBalance,
    balanceRaw: balance as bigint | undefined,
    tokenInfo: parsedTokenInfo,
    
    // Transaction states
    isApproving: isApproving || isMining,
    isTransferring: isTransferring || isMining,
    transactionSuccess: isSuccess,
    
    // Functions
    approve,
    transfer,
    getAllowance,
    refetchBalance,
  }
}

