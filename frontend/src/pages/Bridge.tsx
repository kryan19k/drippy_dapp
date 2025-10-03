import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
  Droplets,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
  Zap,
  ShieldCheck,
  Link2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBridge } from '../hooks/useBridge'
import { useNetwork } from '../contexts/NetworkContext'
import XamanPayloadModal from '../components/XamanPayloadModal'
import { useXRPL } from '../contexts/XRPLContext'

const Bridge: React.FC = () => {
  useNetwork()
  const bridge = useBridge()
  const xrpl = useXRPL()

  // Bridge direction: 'xrpl-to-evm' or 'evm-to-xrpl'
  const [direction, setDirection] = useState<'xrpl-to-evm' | 'evm-to-xrpl'>('xrpl-to-evm')
  const [amount, setAmount] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [showHistory, setShowHistory] = useState(false)
  const [isTrustlineModalOpen, setIsTrustlineModalOpen] = useState(false)
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false)

  // Auto-fill destination address
  useEffect(() => {
    if (direction === 'xrpl-to-evm' && bridge.evmAddress && !destinationAddress) {
      setDestinationAddress(bridge.evmAddress)
    } else if (direction === 'evm-to-xrpl' && bridge.xrplAccount && !destinationAddress) {
      setDestinationAddress(bridge.xrplAccount)
    }
  }, [direction, bridge.evmAddress, bridge.xrplAccount, destinationAddress])

  // Force refresh XRPL balances on mount
  useEffect(() => {
    console.log('🔄 Bridge page mounted, forcing XRPL balance refresh...')
    if (xrpl.isConnected && xrpl.account) {
      xrpl.refreshBalances()
    }
  }, [xrpl.isConnected, xrpl.account])

  const handleFlipDirection = () => {
    setDirection(prev => prev === 'xrpl-to-evm' ? 'evm-to-xrpl' : 'xrpl-to-evm')
    setDestinationAddress('')
    setAmount('')
    setCurrentStep(1)
  }

  const handleSetMaxAmount = () => {
    if (direction === 'xrpl-to-evm') {
      setAmount(bridge.xrplDrippyBalance)
    } else {
      setAmount(bridge.evmDrippyBalance)
    }
  }

  const validateInputs = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return false
    }

    if (!destinationAddress) {
      toast.error('Please enter destination address')
      return false
    }

    const sourceBalance = direction === 'xrpl-to-evm' 
      ? parseFloat(bridge.xrplDrippyBalance)
      : parseFloat(bridge.evmDrippyBalance)

    console.log('💰 Balance Check:', {
      direction,
      amount: parseFloat(amount),
      xrplBalance: bridge.xrplDrippyBalance,
      evmBalance: bridge.evmDrippyBalance,
      sourceBalance,
      hasSufficient: parseFloat(amount) <= sourceBalance
    })

    if (parseFloat(amount) > sourceBalance) {
      toast.error(`Insufficient balance. You have ${sourceBalance} DRIPPY, trying to send ${amount}`)
      return false
    }

    return true
  }

  const handleApprove = async () => {
    if (!validateInputs()) return

    const success = await bridge.approveITS(amount)
    if (success) {
      setCurrentStep(2)
      // Wait for approval to complete
      setTimeout(() => {
        bridge.refetchBalances()
      }, 3000)
    }
  }

  const handleBridge = async () => {
    if (!validateInputs()) return

    if (direction === 'xrpl-to-evm') {
      // Open modal for XRPL → EVM bridge
      setIsBridgeModalOpen(true)
      return
    }

    // For EVM → XRPL, handle directly
    let success = false
    
    if (direction === 'evm-to-xrpl') {
      // Check if approval is needed
      const needsApproval = parseFloat(bridge.itsAllowance) < parseFloat(amount)
      if (needsApproval && currentStep === 1) {
        toast.error('Please approve ITS contract first')
        return
      }

      success = await bridge.bridgeEVMToXRPL(amount, destinationAddress)
      
      if (success) {
        setAmount('')
        setDestinationAddress('')
        setCurrentStep(1)
        setTimeout(() => {
          bridge.refetchBalances()
        }, 60000) // Refresh after 1 minute
      }
    }
  }

  // Not connected state
  if (!bridge.evmConnected && !bridge.xrplConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-primary-500/30"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-accent-500/20">
            <Link2 className="w-10 h-10 text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Connect Your Wallets
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect both XRPL (Xaman) and EVM (MetaMask) wallets to bridge DRIPPY tokens across chains
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-sm text-gray-300">XRPL Wallet</span>
              <span className={`text-sm font-semibold ${bridge.xrplConnected ? 'text-green-400' : 'text-red-400'}`}>
                {bridge.xrplConnected ? '✓ Connected' : '✗ Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-sm text-gray-300">EVM Wallet</span>
              <span className={`text-sm font-semibold ${bridge.evmConnected ? 'text-green-400' : 'text-red-400'}`}>
                {bridge.evmConnected ? '✓ Connected' : '✗ Not Connected'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const sourceChain = direction === 'xrpl-to-evm' ? 'XRPL' : 'EVM'
  const destChain = direction === 'xrpl-to-evm' ? 'EVM' : 'XRPL'
  const sourceBalance = direction === 'xrpl-to-evm' ? bridge.xrplDrippyBalance : bridge.evmDrippyBalance
  const destBalance = direction === 'xrpl-to-evm' ? bridge.evmDrippyBalance : bridge.xrplDrippyBalance

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-primary-400" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              DRIPPY Bridge
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Seamlessly transfer DRIPPY tokens between XRPL Mainnet and XRPL EVM Sidechain using Axelar
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Bridge Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="glass rounded-3xl p-6 border border-white/10">
              {/* Direction Selector */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                      direction === 'xrpl-to-evm'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                    onClick={() => setDirection('xrpl-to-evm')}
                  >
                    XRPL → EVM
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                      direction === 'evm-to-xrpl'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                    onClick={() => setDirection('evm-to-xrpl')}
                  >
                    EVM → XRPL
                  </motion.div>
                </div>
                <motion.button
                  onClick={handleFlipDirection}
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 hover:border-primary-500/50 transition-all"
                >
                  <RefreshCw className="w-5 h-5 text-primary-400" />
                </motion.button>
              </div>

              {/* Bridge Flow Visualization */}
              <div className="relative mb-8 p-6 bg-black/30 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  {/* Source Chain */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex-1"
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                        direction === 'xrpl-to-evm'
                          ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-400/50'
                          : 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50'
                      }`}>
                        <Droplets className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-semibold text-foreground mb-1">{sourceChain}</div>
                      <div className="text-xs text-muted-foreground">Source</div>
                      <div className="mt-2 text-lg font-bold text-primary-400">
                        {parseFloat(sourceBalance).toLocaleString()} DRIPPY
                      </div>
                    </div>
                  </motion.div>

                  {/* Arrow Animation */}
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex-shrink-0 mx-6"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center"
                      >
                        <ArrowRight className="w-6 h-6 text-white" />
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 blur-xl"
                      />
                    </div>
                  </motion.div>

                  {/* Destination Chain */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex-1"
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                        direction === 'evm-to-xrpl'
                          ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-400/50'
                          : 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50'
                      }`}>
                        <Droplets className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-semibold text-foreground mb-1">{destChain}</div>
                      <div className="text-xs text-muted-foreground">Destination</div>
                      <div className="mt-2 text-lg font-bold text-accent-400">
                        {parseFloat(destBalance).toLocaleString()} DRIPPY
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground">Amount to Bridge</label>
                    <button
                      onClick={handleSetMaxAmount}
                      className="text-xs text-primary-400 hover:text-primary-300 font-semibold"
                    >
                      MAX: {parseFloat(sourceBalance).toLocaleString()}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-4 bg-black/30 border border-white/20 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary-500 transition-all text-lg font-semibold"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <Droplets className="w-5 h-5 text-primary-400" />
                      <span className="text-foreground font-bold">DRIPPY</span>
                    </div>
                  </div>
                </div>

                {/* Destination Address */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Destination Address ({destChain})
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder={direction === 'xrpl-to-evm' ? '0x...' : 'r...'}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary-500 transition-all font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {direction === 'xrpl-to-evm' && bridge.evmAddress && (
                      <span>Current EVM wallet: {bridge.evmAddress.slice(0, 12)}...{bridge.evmAddress.slice(-8)}</span>
                    )}
                    {direction === 'evm-to-xrpl' && bridge.xrplAccount && (
                      <span>Current XRPL wallet: {bridge.xrplAccount}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bridge Info */}
              <div className="space-y-2 mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="text-foreground font-semibold flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>~{bridge.estimatedTime}s</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bridge Fee:</span>
                  <span className="text-foreground font-semibold">~{bridge.bridgeFee} XRP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You Will Receive:</span>
                  <span className="text-green-400 font-bold">
                    {amount || '0'} DRIPPY
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Step 1: Approve (EVM → XRPL only) */}
                {direction === 'evm-to-xrpl' && parseFloat(bridge.itsAllowance) < parseFloat(amount || '0') && (
                  <motion.button
                    onClick={handleApprove}
                    disabled={bridge.isBridging || !amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>{bridge.isBridging ? 'Approving...' : 'Step 1: Approve ITS Contract'}</span>
                  </motion.button>
                )}

                {/* Step 2: Bridge */}
                <motion.button
                  onClick={handleBridge}
                  disabled={bridge.isBridging || !amount || !destinationAddress}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-500 disabled:to-gray-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>
                    {bridge.isBridging 
                      ? 'Bridging...' 
                      : direction === 'evm-to-xrpl' && parseFloat(bridge.itsAllowance) < parseFloat(amount || '0')
                        ? 'Step 2: Bridge Tokens'
                        : 'Bridge Tokens'}
                  </span>
                </motion.button>
              </div>

              {/* Warning for XRPL trustline with setup button */}
              {direction === 'evm-to-xrpl' && !bridge.hasDrippyTrustline && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-300">
                      <strong>Trustline Required:</strong> Your XRPL wallet needs a DRIPPY trustline to receive tokens.
                    </div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg text-xs text-gray-300 font-mono">
                    <div>Issuer: <span className="text-blue-400">{import.meta.env.VITE_DRIPPY_ISSUER || 'rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM'}</span></div>
                    <div>Currency: <span className="text-green-400">DRIPPY</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => {
                        if (!xrpl.account) {
                          toast.error('Please connect your XRPL wallet first')
                          return
                        }
                        setIsTrustlineModalOpen(true)
                      }}
                      disabled={bridge.isBridging || !bridge.xrplConnected}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="col-span-2 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Set Up DRIPPY Trustline</span>
                    </motion.button>
                    <motion.button
                      onClick={async () => {
                        toast.loading('Checking trustline status...')
                        await xrpl.refreshBalances()
                        await bridge.refetchBalances()
                        setTimeout(() => {
                          toast.dismiss()
                          if (bridge.hasDrippyTrustline) {
                            toast.success('✅ Trustline detected!')
                          } else {
                            toast.error('Trustline not found yet. Try again in a few seconds.')
                          }
                        }, 2000)
                      }}
                      disabled={bridge.isBridging}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="col-span-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Check Trustline Status</span>
                    </motion.button>
                  </div>
                  <div className="text-xs text-gray-400 italic">
                    Already set up the trustline? Click "Check Trustline Status" to refresh.
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Bridge Stats */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center space-x-2">
                <Info className="w-5 h-5 text-primary-400" />
                <span>Bridge Info</span>
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Powered by</div>
                  <div className="text-sm font-bold text-primary-400">Axelar Network</div>
                </div>
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Security</div>
                  <div className="text-sm font-semibold text-green-400 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Decentralized</span>
                  </div>
                </div>
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Total Bridged</div>
                  <div className="text-sm font-bold text-foreground">
                    {bridge.bridgeHistory.length} transactions
                  </div>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary-400" />
                  <span>Recent Activity</span>
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-primary-400 hover:text-primary-300 font-semibold"
                >
                  {showHistory ? 'Hide' : 'Show All'}
                </button>
              </div>
              
              <div className="space-y-2">
                {bridge.bridgeHistory.slice(0, showHistory ? 10 : 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-black/30 rounded-lg border border-white/10 hover:border-primary-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {tx.sourceChain === 'xrpl' ? (
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ArrowLeft className="w-4 h-4 text-purple-400" />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {tx.sourceChain.toUpperCase()} → {tx.destinationChain.toUpperCase()}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {parseFloat(tx.amount).toLocaleString()} DRIPPY
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                
                {bridge.bridgeHistory.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No bridge transactions yet
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="glass rounded-2xl p-6 border border-blue-500/30 bg-blue-500/5">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-400" />
                <span>How It Works</span>
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-400">1.</span>
                  <span>Connect both XRPL and EVM wallets</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-400">2.</span>
                  <span>Select bridge direction and amount</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-400">3.</span>
                  <span>Approve (EVM→XRPL) and confirm transaction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-400">4.</span>
                  <span>Wait 1-2 minutes for tokens to arrive</span>
                </li>
              </ol>
            </div>
          </motion.div>
        </div>

        {/* Trustline Setup Modal */}
        <XamanPayloadModal
          isOpen={isTrustlineModalOpen}
          onClose={() => setIsTrustlineModalOpen(false)}
          endpoint="/api/xumm/create-trustline"
          body={{
            userAddress: xrpl.account,
            issuer: import.meta.env.VITE_DRIPPY_ISSUER || 'rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM',
            currency: import.meta.env.VITE_DRIPPY_CURRENCY || 'DRIPPY',
            limit: import.meta.env.VITE_DRIPPY_TRUSTLINE_LIMIT || '1000000000'
          }}
          onResolved={(result) => {
            console.log('Trustline result:', result)
            if (result.signed) {
              toast.success('✅ Trustline set up successfully!')
              setTimeout(() => {
                xrpl.refreshBalances()
                bridge.refetchBalances()
              }, 3000)
            } else {
              toast.error('Trustline setup was cancelled')
            }
            setIsTrustlineModalOpen(false)
          }}
        />

        {/* Bridge XRPL → EVM Modal */}
        <XamanPayloadModal
          isOpen={isBridgeModalOpen}
          onClose={() => setIsBridgeModalOpen(false)}
          endpoint="/api/xumm/create-bridge-payment"
          body={{
            userAddress: xrpl.account,
            destinationAddress: 'rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2', // Axelar Gateway
            amount: amount,
            issuer: import.meta.env.VITE_DRIPPY_ISSUER || 'rnBpAWMDoD9Tmo7b5tsogmRyVqYNX1iUuM',
            currency: import.meta.env.VITE_DRIPPY_CURRENCY || 'DRIPPY',
            evmDestination: destinationAddress, // EVM address to receive tokens
            destinationChain: 'xrpl-evm' // Axelar chain identifier
          }}
          onResolved={(result) => {
            console.log('Bridge result:', result)
            if (result.signed) {
              toast.success('✅ Bridge transaction submitted! Wait 1-2 minutes for tokens to arrive.')
              setAmount('')
              setDestinationAddress('')
              setCurrentStep(1)
              setTimeout(() => {
                xrpl.refreshBalances()
                bridge.refetchBalances()
              }, 60000)
            } else {
              toast.error('Bridge transaction was cancelled')
            }
            setIsBridgeModalOpen(false)
          }}
        />
      </div>
    </div>
  )
}

export default Bridge

