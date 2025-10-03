import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import toast from 'react-hot-toast'
import { 
  DRIPPY_TOKEN_ADDRESS, 
  DRIPPY_TOKEN_ABI,
  FEE_ROUTER_ADDRESS,
  FEE_ROUTER_ABI
} from '../../contracts/latest'

/**
 * Hook for admin functions on DRIPPY token and FeeRouter
 * Checks roles and provides contract management functions
 */
export function useAdmin() {
  const { address, isConnected, chainId } = useAccount()
  const [isProcessing, setIsProcessing] = useState(false)

  // TESTNET CHAIN ID - Where contracts are deployed
  const EXPECTED_CHAIN_ID = 1449000 // 0x161c28 - XRPL EVM Testnet
  const isCorrectChain = chainId === EXPECTED_CHAIN_ID

  // Role constants (from contract)
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'
  const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929'
  const FEE_MANAGER_ROLE = '0x2548c1d5d7d6b1cc1c1f20c85493a58f95c47b11fdbae6e0b09b1f1d3a1e1c5f'
  const BRIDGE_ROLE = '0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357' // keccak256("BRIDGE_ROLE")

  // Check roles - ONLY if on correct chain
  const { data: isDefaultAdmin, error: adminError, isLoading: isLoadingAdmin } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'hasRole',
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
    query: { 
      enabled: !!address && isConnected && isCorrectChain,
      retry: 3,
      retryDelay: 1000
    }
  })
  
  // Debug role checks with detailed logging
  useEffect(() => {
    if (isConnected && address) {
      console.log('====== ADMIN ROLE CHECK DEBUG ======')
      console.log('👤 Wallet Address:', address)
      console.log('📝 Contract Address:', DRIPPY_TOKEN_ADDRESS)
      console.log('🔗 Current Chain ID:', chainId, `(0x${chainId?.toString(16)})`)
      console.log('✅ Expected Chain ID:', EXPECTED_CHAIN_ID, '(0x161c28 - TESTNET)')
      console.log('⚠️  Chain Match:', isCorrectChain ? '✅ CORRECT' : '❌ WRONG NETWORK!')
      console.log('🔐 DEFAULT_ADMIN_ROLE check:', isDefaultAdmin)
      console.log('⏳ Loading:', isLoadingAdmin)
      
      if (!isCorrectChain) {
        console.error('🚨 WRONG NETWORK DETECTED!')
        console.error(`   You are on: Chain ${chainId} (0x${chainId?.toString(16)})`)
        console.error(`   Should be on: Chain ${EXPECTED_CHAIN_ID} (0x161c28)`)
        console.error('   💡 SOLUTION: Switch to XRPL EVM TESTNET using the network switcher')
      }
      
      if (adminError) {
        console.error('❌ Admin role check error:', adminError)
        console.error('Error details:', {
          message: adminError.message,
          name: adminError.name,
          cause: adminError.cause
        })
        
        // Check if contract exists
        if (adminError.message?.includes('returned no data') || adminError.message?.includes('0x')) {
          console.error('🚨 CONTRACT NOT FOUND! Possible reasons:')
          console.error('   1. Wrong network - You must be on TESTNET (Chain 1449000)')
          console.error('   2. Contract not deployed at this address on current network')
          console.error('   3. Contract address is incorrect')
          console.error('   💡 Verify contracts are deployed on the network you are connected to')
        }
      }
      console.log('====================================')
    }
  }, [isConnected, address, chainId, isCorrectChain, isDefaultAdmin, adminError, isLoadingAdmin])

  const { data: isOperator } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'hasRole',
    args: address ? [OPERATOR_ROLE, address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  const { data: isFeeManager } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'hasRole',
    args: address ? [FEE_MANAGER_ROLE, address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  // Check if paused
  const { data: isPaused } = useReadContract({
    address: DRIPPY_TOKEN_ADDRESS,
    abi: DRIPPY_TOKEN_ABI,
    functionName: 'paused',
  })

  const { data: isRouterPaused } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'paused',
  })

  // Write functions
  const { writeContract, data: hash } = useWriteContract()
  const { isSuccess, isLoading: isMining } = useWaitForTransactionReceipt({ hash })

  // Helper to execute write with error handling
  const executeWrite = async (
    contractAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args?: any[],
    successMessage = 'Transaction submitted!'
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return false
    }

    try {
      setIsProcessing(true)
      
      writeContract({
        address: contractAddress,
        abi,
        functionName,
        args: args || [],
      })

      toast.success(successMessage)
      return true
    } catch (error: any) {
      console.error(`${functionName} error:`, error)
      toast.error(error?.message || `${functionName} failed`)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  // ========== TOKEN ADMIN FUNCTIONS ==========

  // Launch token
  const launch = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'launch',
      undefined,
      'Token launched! Anti-snipe active.'
    )
  }

  // Disable anti-snipe
  const disableAntiSnipe = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'disableAntiSnipe',
      undefined,
      'Anti-snipe disabled'
    )
  }

  // Update tax rates
  const updateTaxRates = async (normalTax: number, antiSnipeTax: number) => {
    const normalBps = normalTax * 100 // Convert % to basis points
    const antiSnipeBps = antiSnipeTax * 100
    
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'updateTaxRates',
      [normalBps, antiSnipeBps],
      'Tax rates updated'
    )
  }

  // Update limits
  const updateLimits = async (maxTx: string, maxWallet: string) => {
    const maxTxWei = parseUnits(maxTx, 18)
    const maxWalletWei = parseUnits(maxWallet, 18)
    
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'updateLimits',
      [maxTxWei, maxWalletWei],
      'Limits updated'
    )
  }

  // Remove limits
  const removeLimits = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'removeLimits',
      undefined,
      'Limits removed permanently'
    )
  }

  // Set AMM pair
  const setAMMPair = async (pairAddress: `0x${string}`, status: boolean) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'setAMMPair',
      [pairAddress, status],
      `AMM pair ${status ? 'added' : 'removed'}`
    )
  }

  // Set excluded from tax
  const setExcludedFromTax = async (account: `0x${string}`, status: boolean) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'setExcludedFromTax',
      [account, status],
      `Account ${status ? 'excluded from' : 'included in'} tax`
    )
  }

  // Add to whitelist
  const addToWhitelist = async (accounts: `0x${string}`[]) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'addToWhitelist',
      [accounts],
      'Addresses whitelisted'
    )
  }

  // Remove from whitelist
  const removeFromWhitelist = async (accounts: `0x${string}`[]) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'removeFromWhitelist',
      [accounts],
      'Addresses removed from whitelist'
    )
  }

  // Blacklist addresses
  const blacklistAddresses = async (accounts: `0x${string}`[]) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'blacklistAddresses',
      [accounts],
      'Addresses blacklisted'
    )
  }

  // Unblacklist addresses
  const unblacklistAddresses = async (accounts: `0x${string}`[]) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'unblacklistAddresses',
      [accounts],
      'Addresses unblacklisted'
    )
  }

  // Pause token
  const pauseToken = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'pause',
      undefined,
      'Token paused'
    )
  }

  // Unpause token
  const unpauseToken = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'unpause',
      undefined,
      'Token unpaused'
    )
  }

  // Distribute fees
  const distributeFees = async () => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'distributeFees',
      undefined,
      'Fees distributed'
    )
  }

  // Update fee config
  const updateFeeConfig = async (nft: number, token: number, treasury: number, amm: number) => {
    const nftBps = nft * 100
    const tokenBps = token * 100
    const treasuryBps = treasury * 100
    const ammBps = amm * 100
    
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'updateFeeConfig',
      [nftBps, tokenBps, treasuryBps, ammBps],
      'Fee distribution updated'
    )
  }

  // ========== FEE ROUTER ADMIN FUNCTIONS ==========

  // Force distribute
  const forceDistribute = async () => {
    return executeWrite(
      FEE_ROUTER_ADDRESS,
      FEE_ROUTER_ABI,
      'forceDistribute',
      undefined,
      'Distribution forced'
    )
  }

  // Update distribution config
  const updateDistributionConfig = async (nft: number, token: number, treasury: number, amm: number) => {
    const nftBps = nft * 100
    const tokenBps = token * 100
    const treasuryBps = treasury * 100
    const ammBps = amm * 100
    
    return executeWrite(
      FEE_ROUTER_ADDRESS,
      FEE_ROUTER_ABI,
      'updateDistributionConfig',
      [nftBps, tokenBps, treasuryBps, ammBps],
      'Router distribution updated'
    )
  }

  // Update min distribution amount
  const updateMinDistribution = async (amount: string) => {
    const amountWei = parseUnits(amount, 18)
    
    return executeWrite(
      FEE_ROUTER_ADDRESS,
      FEE_ROUTER_ABI,
      'updateMinDistributionAmount',
      [amountWei],
      'Min distribution updated'
    )
  }

  // Pause router
  const pauseRouter = async () => {
    return executeWrite(
      FEE_ROUTER_ADDRESS,
      FEE_ROUTER_ABI,
      'pause',
      undefined,
      'Router paused'
    )
  }

  // Unpause router
  const unpauseRouter = async () => {
    return executeWrite(
      FEE_ROUTER_ADDRESS,
      FEE_ROUTER_ABI,
      'unpause',
      undefined,
      'Router unpaused'
    )
  }

  // Grant role
  const grantRole = async (roleHash: string, account: `0x${string}`) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'grantRole',
      [roleHash, account],
      'Role granted'
    )
  }

  // Revoke role
  const revokeRole = async (roleHash: string, account: `0x${string}`) => {
    return executeWrite(
      DRIPPY_TOKEN_ADDRESS,
      DRIPPY_TOKEN_ABI,
      'revokeRole',
      [roleHash, account],
      'Role revoked'
    )
  }

  // Bridge mint (requires BRIDGE_ROLE)
  const bridgeMint = async (to: `0x${string}`, amount: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return false
    }

    try {
      setIsProcessing(true)
      const amountWei = parseUnits(amount, 18)

      console.log('🌉 Bridge Mint:', {
        to,
        amount,
        amountWei: amountWei.toString(),
        contract: DRIPPY_TOKEN_ADDRESS
      })

      writeContract({
        address: DRIPPY_TOKEN_ADDRESS,
        abi: DRIPPY_TOKEN_ABI,
        functionName: 'bridgeMint',
        args: [to, amountWei, 'Initial Mint'], // to, amount, sourceChain
      })

      toast.success('Mint transaction submitted!')
      return true
    } catch (error: any) {
      console.error('Mint error:', error)
      toast.error(error?.shortMessage || error?.message || 'Mint failed')
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    // Roles
    isDefaultAdmin: isCorrectChain ? (isDefaultAdmin as boolean ?? false) : false,
    isOperator: isCorrectChain ? (isOperator as boolean ?? false) : false,
    isFeeManager: isCorrectChain ? (isFeeManager as boolean ?? false) : false,
    hasAnyRole: isCorrectChain ? ((isDefaultAdmin || isOperator || isFeeManager) as boolean) : false,
    
    // Network status
    isCorrectChain,
    currentChainId: chainId,
    expectedChainId: EXPECTED_CHAIN_ID,
    
    // States
    isPaused: isPaused as boolean ?? false,
    isRouterPaused: isRouterPaused as boolean ?? false,
    isProcessing: isProcessing || isMining,
    transactionSuccess: isSuccess,
    
    // Role constants
    roles: {
      DEFAULT_ADMIN_ROLE,
      OPERATOR_ROLE,
      FEE_MANAGER_ROLE,
      BRIDGE_ROLE,
    },
    
    // Token admin functions
    launch,
    disableAntiSnipe,
    updateTaxRates,
    updateLimits,
    removeLimits,
    setAMMPair,
    setExcludedFromTax,
    addToWhitelist,
    removeFromWhitelist,
    blacklistAddresses,
    unblacklistAddresses,
    pauseToken,
    unpauseToken,
    distributeFees,
    updateFeeConfig,
    
    // Router admin functions
    forceDistribute,
    updateDistributionConfig,
    updateMinDistribution,
    pauseRouter,
    unpauseRouter,
    
    // Role management
    grantRole,
    revokeRole,
    
    // Bridge/Mint functions
    bridgeMint,
  }
}

