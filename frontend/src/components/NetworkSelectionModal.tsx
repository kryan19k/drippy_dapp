import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Droplets, ArrowRight, CheckCircle, Sparkles, TrendingUp, Shield, Coins } from 'lucide-react'
import { useNetwork } from '../contexts/NetworkContext'
import { NetworkType } from '../types/network'

interface NetworkSelectionModalProps {
  isOpen: boolean
  onClose?: () => void
}

const NetworkSelectionModal: React.FC<NetworkSelectionModalProps> = ({ isOpen, onClose }) => {
  const { switchToXRPL, switchToEVM, setFirstVisitComplete } = useNetwork()
  const [selectedType, setSelectedType] = useState<NetworkType | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleNetworkSelect = (type: NetworkType) => {
    setSelectedType(type)
    setIsAnimating(true)
    
    setTimeout(() => {
      if (type === 'xrpl') {
        switchToXRPL('mainnet')
      } else {
        // Switch to TESTNET where contracts are deployed!
        switchToEVM('testnet')
      }
      setFirstVisitComplete()
      setIsAnimating(false)
      onClose?.()
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Animated background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          />
        </div>

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-5xl mx-auto my-auto"
        >
          <div className="glass rounded-3xl border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-8 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.img
                    src="/drippylogo.png"
                    alt="Drippy"
                    className="w-12 h-12 object-contain"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <div>
                    <h1 className="text-3xl font-black text-foreground">Welcome to Drippy</h1>
                    <p className="text-muted-foreground">Choose your network to get started</p>
                  </div>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg glass border border-white/20 hover:border-white/40 transition-all"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Network Options */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* XRPL Mainnet Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isAnimating && handleNetworkSelect('xrpl')}
                  className={`relative cursor-pointer group ${isAnimating && selectedType !== 'xrpl' ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    selectedType === 'xrpl'
                      ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                      : 'border-white/20 group-hover:border-blue-500/50 shadow-lg'
                  }`}>
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent" />
                    
                    {/* Animated glow on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                    />

                    <div className="relative p-8">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500/50 transition-all">
                          <Droplets className="w-10 h-10 text-blue-400" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center">
                        XRPL Mainnet
                        {selectedType === 'xrpl' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2"
                          >
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </motion.div>
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Lightning-fast transactions on XRPL with Xaman wallet. Perfect for trading & quick transfers.
                      </p>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {[
                          { icon: TrendingUp, text: 'AMM Trading' },
                          { icon: Coins, text: 'Buy DRIPPY Tokens' },
                          { icon: Shield, text: 'Send & Receive XRP' },
                          { icon: Sparkles, text: 'Real-time Analytics' },
                        ].map((feature, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center space-x-3 text-sm"
                          >
                            <feature.icon className="w-4 h-4 text-blue-400" />
                            <span className="text-muted-foreground">{feature.text}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/50"
                      >
                        <span>Connect with Xaman</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {selectedType === 'xrpl' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-2xl border-2 border-blue-500 animate-pulse"
                    />
                  )}
                </motion.div>

                {/* EVM Sidechain Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isAnimating && handleNetworkSelect('evm')}
                  className={`relative cursor-pointer group ${isAnimating && selectedType !== 'evm' ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    selectedType === 'evm'
                      ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                      : 'border-white/20 group-hover:border-purple-500/50 shadow-lg'
                  }`}>
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent" />
                    
                    {/* Animated glow on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                    />

                    <div className="relative p-8">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:border-purple-500/50 transition-all">
                          <Zap className="w-10 h-10 text-purple-400" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center">
                        XRPL EVM Sidechain
                        {selectedType === 'evm' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2"
                          >
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </motion.div>
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Full DeFi features with smart contracts, NFTs, staking & governance on the EVM sidechain.
                      </p>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {[
                          { icon: TrendingUp, text: 'Token Swaps & LP Pools' },
                          { icon: Sparkles, text: 'NFT Marketplace' },
                          { icon: Shield, text: 'Staking & Governance' },
                          { icon: Coins, text: 'Smart Contract DeFi' },
                        ].map((feature, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center space-x-3 text-sm"
                          >
                            <feature.icon className="w-4 h-4 text-purple-400" />
                            <span className="text-muted-foreground">{feature.text}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/50"
                      >
                        <span>Connect Web3 Wallet</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {selectedType === 'evm' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-2xl border-2 border-purple-500 animate-pulse"
                    />
                  )}
                </motion.div>
              </div>

              {/* Info Text */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="inline w-4 h-4 mr-1 text-accent" />
                  You can switch networks anytime from the settings menu
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading overlay when animating */}
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"
              />
              <p className="text-lg font-semibold text-foreground">Connecting to network...</p>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}

export default NetworkSelectionModal

