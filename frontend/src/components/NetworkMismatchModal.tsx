import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Network, X } from 'lucide-react'
import { useAccount, useSwitchChain } from 'wagmi'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

interface NetworkMismatchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NetworkMismatchModal: React.FC<NetworkMismatchModalProps> = ({ isOpen, onClose }) => {
  const { chainId } = useAccount()
  const { currentNetwork } = useNetwork()
  const { switchChain, isPending } = useSwitchChain()

  const handleSwitchNetwork = async () => {
    if (!currentNetwork.chainId) return

    // Ensure chainId is a number
    const chainIdNumber = typeof currentNetwork.chainId === 'string' 
      ? parseInt(currentNetwork.chainId, 10) 
      : currentNetwork.chainId

    try {
      await switchChain({ chainId: chainIdNumber })
      toast.success(`Switched to ${currentNetwork.displayName}`)
      onClose()
    } catch (error: any) {
      // If network doesn't exist, try to add it
      if (error?.code === 4902 || error?.message?.includes('Unrecognized chain')) {
        await addNetworkToMetaMask()
      } else {
        toast.error('Failed to switch network. Please try manually in MetaMask.')
      }
    }
  }

  const addNetworkToMetaMask = async () => {
    if (!window.ethereum || !currentNetwork.chainId) return

    // Ensure chainId is a number
    const chainIdNumber = typeof currentNetwork.chainId === 'string' 
      ? parseInt(currentNetwork.chainId, 10) 
      : currentNetwork.chainId
    
    const chainIdHex = `0x${chainIdNumber.toString(16)}`

    try {
      await (window.ethereum as any).request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: currentNetwork.displayName,
          nativeCurrency: {
            name: currentNetwork.currency,
            symbol: currentNetwork.currency,
            decimals: 18,
          },
          rpcUrls: [currentNetwork.rpcUrl],
          blockExplorerUrls: [currentNetwork.explorerUrl],
        }],
      })
      
      toast.success(`${currentNetwork.displayName} added to MetaMask!`)
      
      // Try switching again after adding
      setTimeout(() => handleSwitchNetwork(), 500)
    } catch (error: any) {
      console.error('Error adding network:', error)
      toast.error('Failed to add network to MetaMask')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <div className="glass p-8 rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
                  Wrong Network
                </h2>

                {/* Description */}
                <p className="text-center text-muted-foreground mb-6">
                  You're connected to chain <span className="font-semibold text-foreground">{chainId}</span>, but this app requires{' '}
                  <span className="font-semibold text-yellow-400">{currentNetwork.displayName}</span> (Chain ID: {currentNetwork.chainId}).
                </p>

                {/* Network Info */}
                <div className="mb-6 p-4 bg-muted rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Required Network:</span>
                    <span className="text-sm font-semibold text-foreground">{currentNetwork.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Chain ID:</span>
                    <span className="text-sm font-mono text-foreground">{currentNetwork.chainId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">RPC:</span>
                    <span className="text-sm font-mono text-foreground text-xs">{currentNetwork.rpcUrl.slice(8, 25)}...</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleSwitchNetwork}
                    disabled={isPending}
                    className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Network className="w-5 h-5" />
                    <span>{isPending ? 'Switching...' : 'Switch Network'}</span>
                  </button>

                  <button
                    onClick={addNetworkToMetaMask}
                    className="w-full px-6 py-3 rounded-xl font-semibold text-foreground glass hover:bg-white/5 transition-all border border-white/10"
                  >
                    Add Network to MetaMask
                  </button>
                </div>

                {/* Help Text */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  The network will be added to your MetaMask automatically
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

