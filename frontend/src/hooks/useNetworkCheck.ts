import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

/**
 * Hook to automatically check and switch to the correct EVM network
 * Prompts user to add network to MetaMask if not found
 */
export function useNetworkCheck() {
  const { address, isConnected, chainId } = useAccount()
  const { currentNetwork } = useNetwork()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    const checkAndSwitchNetwork = async () => {
      // Only check if connected and on EVM network
      if (!isConnected || !address || currentNetwork.type !== 'evm') {
        return
      }

      const targetChainId = currentNetwork.chainId
      if (!targetChainId) return

      // Ensure targetChainId is a number
      const targetChainIdNumber = typeof targetChainId === 'string' ? parseInt(targetChainId, 10) : targetChainId

      // Already on correct network
      if (chainId === targetChainIdNumber) {
        return
      }

      console.log(`🔄 Network mismatch detected. Current: ${chainId}, Expected: ${targetChainIdNumber}`)

      try {
        // Try to switch to the network
        await switchChain({ chainId: targetChainIdNumber })
        toast.success(`Switched to ${currentNetwork.displayName}`)
      } catch (switchError: any) {
        console.log('Switch failed, attempting to add network...', switchError)

        // If switch fails, try to add the network
        if (switchError?.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
          try {
            await addNetworkToMetaMask(currentNetwork)
            toast.success(`${currentNetwork.displayName} added to MetaMask!`)
            
            // Try switching again after adding
            setTimeout(async () => {
              try {
                await switchChain({ chainId: targetChainIdNumber })
              } catch (retryError) {
                console.error('Failed to switch after adding:', retryError)
              }
            }, 500)
          } catch (addError: any) {
            console.error('Failed to add network:', addError)
            toast.error(
              `Please add ${currentNetwork.displayName} (Chain ID: ${targetChainIdNumber}) to MetaMask manually`,
              { duration: 5000 }
            )
          }
        } else {
          toast.error(`Failed to switch to ${currentNetwork.displayName}. Please switch manually in MetaMask.`)
        }
      }
    }

    // Small delay to ensure wallet is fully connected
    const timer = setTimeout(checkAndSwitchNetwork, 500)
    return () => clearTimeout(timer)
  }, [isConnected, address, chainId, currentNetwork, switchChain])
}

/**
 * Add a network to MetaMask using wallet_addEthereumChain
 */
async function addNetworkToMetaMask(network: any) {
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const chainIdHex = `0x${network.chainId.toString(16)}`

  const params = {
    chainId: chainIdHex,
    chainName: network.displayName,
    nativeCurrency: {
      name: network.currency,
      symbol: network.currency,
      decimals: 18,
    },
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [network.explorerUrl],
  }

  try {
    await (window.ethereum as any).request({
      method: 'wallet_addEthereumChain',
      params: [params],
    })
  } catch (error: any) {
    console.error('Error adding network to MetaMask:', error)
    throw error
  }
}

