import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet as WalletIcon,
  Send,
  Copy,
  ExternalLink,
  RefreshCw,
  Coins,
  History,
  QrCode} from 'lucide-react'
import { useXRPL } from '../contexts/XRPLContext'
import { useEVM } from '../contexts/EVMContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const Wallet: React.FC = () => {
  const { networkType, currentNetwork, environment } = useNetwork()
  
  // XRPL wallet
  const { 
    isConnected: xrplConnected, 
    address: xrplAddress,
    balance: xrplBalance, 
    drippyBalance,
    refreshBalances: refreshXRPL,
    connectWallet: connectXRPL 
  } = useXRPL() as any
  
  // EVM wallet
  const { 
    isConnected: evmConnected, 
    address: evmAddress, 
    balance: evmBalance,
    connectWallet: connectEVM 
  } = useEVM()

  const [sendAmount, setSendAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'history'>('send')

  const isConnected = networkType === 'xrpl' ? xrplConnected : evmConnected
  const address = networkType === 'xrpl' ? xrplAddress : evmAddress
  const connectWallet = networkType === 'xrpl' ? connectXRPL : connectEVM

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard!')
    }
  }

  const handleSend = () => {
    if (!sendAmount || !recipientAddress) {
      toast.error('Please enter amount and recipient address')
      return
    }
    toast.success('Transaction coming soon! 🚀')
  }

  // Not Connected State
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-white/10"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
            networkType === 'xrpl' 
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
              : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
          }`}>
            <WalletIcon className={`w-10 h-10 ${
              networkType === 'xrpl' ? 'text-blue-400' : 'text-purple-400'
            }`} />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Wallet
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your {networkType === 'xrpl' ? 'Xaman' : 'Web3'} wallet to manage your assets
          </p>
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              networkType === 'xrpl'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Connected - XRPL
  if (networkType === 'xrpl') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <WalletIcon className="w-8 h-8 text-blue-400" />
              <span>XRPL Wallet</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentNetwork.displayName} • {environment}
            </p>
          </div>
          <button
            onClick={refreshXRPL}
            className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 glass border border-white/10 hover:border-blue-500/30 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XRP Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Coins className="w-6 h-6 text-blue-400" />
              </div>
              <button onClick={handleCopyAddress} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">XRP Balance</p>
            <p className="text-3xl font-bold text-foreground mb-2">{xrplBalance || '0.00'}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : ''}
            </p>
          </motion.div>

          {/* DRIPPY Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Coins className="w-6 h-6 text-cyan-400" />
              </div>
              <a 
                href={`${currentNetwork.explorerUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground mb-1">DRIPPY Balance</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {drippyBalance || '0.00'}
            </p>
            <p className="text-xs text-cyan-400">≈ $0.00 USD</p>
          </motion.div>
        </div>

        {/* Action Tabs */}
        <div className="card-elevated rounded-2xl border border-white/5 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-white/5">
            {(['send', 'receive', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Send Tab */}
            {activeTab === 'send' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Amount (XRP)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSend}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send XRP</span>
                </button>
              </motion.div>
            )}

            {/* Receive Tab */}
            {activeTab === 'receive' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-48 h-48 mx-auto bg-white rounded-2xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-900" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your XRPL Address</p>
                  <div className="flex items-center justify-center space-x-2">
                    <p className="font-mono text-foreground">{address}</p>
                    <button onClick={handleCopyAddress} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <Copy className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan QR code or copy address to receive XRP
                </p>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Transaction history coming soon!</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Connected - EVM
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <WalletIcon className="w-8 h-8 text-purple-400" />
            <span>EVM Wallet</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentNetwork.displayName} • {environment}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-8 rounded-2xl border border-white/5"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="p-4 bg-purple-500/10 rounded-xl">
            <WalletIcon className="w-8 h-8 text-purple-400" />
          </div>
          <button onClick={handleCopyAddress} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
        <p className="text-4xl font-bold text-foreground mb-3">{evmBalance || '0.00'}</p>
        <p className="text-sm text-muted-foreground font-mono mb-4">
          {evmAddress ? `${evmAddress.slice(0, 10)}...${evmAddress.slice(-8)}` : ''}
        </p>
        <div className="flex space-x-3">
          <a
            href={`${currentNetwork.explorerUrl}/address/${evmAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 glass border border-white/10 hover:border-purple-500/30 rounded-lg transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">View on Explorer</span>
          </a>
        </div>
      </motion.div>

      {/* Token List */}
      <div className="card-elevated rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold text-foreground">Your Tokens</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tokens found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Token balances will appear here once you acquire some
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-elevated rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent transactions</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet

