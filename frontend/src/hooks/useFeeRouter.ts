import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { 
  FEE_ROUTER_ADDRESS, 
  FEE_ROUTER_ABI 
} from '../../contracts/latest'

/**
 * Hook for reading FeeRouter contract data
 * Provides distribution stats, pending fees, and pool info
 */
export function useFeeRouter() {
  
  // Read distribution stats
  const { data: stats } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'getStats',
  })

  // Read configuration
  const { data: config } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'getConfig',
  })

  // Read pending distribution
  const { data: pendingDistribution } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'getPendingDistribution',
  })

  // Can distribute check
  const { data: canDistribute } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'canDistribute',
  })

  // Preview distribution
  const { data: preview } = useReadContract({
    address: FEE_ROUTER_ADDRESS,
    abi: FEE_ROUTER_ABI,
    functionName: 'previewDistribution',
  })

  // Parse stats
  const parsedStats = stats ? {
    totalDistributed: formatUnits((stats as any)[0], 18),
    distributionCount: Number((stats as any)[1]),
    pendingDistribution: formatUnits((stats as any)[2], 18),
    minDistribution: formatUnits((stats as any)[3], 18),
  } : null

  // Parse config
  const parsedConfig = config ? {
    nftPool: (config as any)[0] as string,
    tokenPool: (config as any)[1] as string,
    treasuryPool: (config as any)[2] as string,
    ammPool: (config as any)[3] as string,
    nftPoolBps: Number((config as any)[4]) / 100, // Convert to percentage
    tokenPoolBps: Number((config as any)[5]) / 100,
    treasuryPoolBps: Number((config as any)[6]) / 100,
    ammPoolBps: Number((config as any)[7]) / 100,
  } : null

  // Parse preview
  const parsedPreview = preview ? {
    total: formatUnits((preview as any)[0], 18),
    nftAmount: formatUnits((preview as any)[1], 18),
    tokenAmount: formatUnits((preview as any)[2], 18),
    treasuryAmount: formatUnits((preview as any)[3], 18),
    ammAmount: formatUnits((preview as any)[4], 18),
  } : null

  return {
    stats: parsedStats,
    config: parsedConfig,
    pendingDistribution: pendingDistribution ? formatUnits(pendingDistribution as bigint, 18) : '0',
    canDistribute: canDistribute as boolean ?? false,
    preview: parsedPreview,
  }
}

