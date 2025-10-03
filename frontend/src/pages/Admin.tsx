import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Settings,
  Users,
  AlertTriangle,
  Zap,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  Ban,
  CheckCircle,
  XCircle,
  Crown,
  RefreshCw
} from 'lucide-react'
import { useAdmin } from '../hooks/useAdmin'
import { useToken } from '../hooks/useToken'
import { useFeeRouter } from '../hooks/useFeeRouter'
import { useEVM } from '../contexts/EVMContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const Admin: React.FC = () => {
  const { networkType, currentNetwork, switchToEVM } = useNetwork()
  const { isConnected, connectWallet, switchChain, address } = useEVM()
  const { tokenInfo, refetchBalance, balance, transfer, isTransferring } = useToken()
  const { stats } = useFeeRouter()
  const admin = useAdmin()

  // Handle network switch to testnet
  const handleSwitchToTestnet = async () => {
    try {
      // First switch in MetaMask
      if (switchChain) {
        await switchChain(1449000) // XRPL EVM Testnet
      }
      // Then update app context
      switchToEVM('testnet')
      toast.success('Switched to XRPL EVM Testnet')
    } catch (error: any) {
      console.error('Network switch error:', error)
      // User might need to add the network manually
      if (error.code === 4902) {
        toast.error('Please add XRPL EVM Testnet to MetaMask manually')
      } else {
        toast.error(error.message || 'Failed to switch network')
      }
    }
  }

  // Form states
  const [activeTab, setActiveTab] = useState<'overview' | 'token' | 'fees' | 'access' | 'emergency' | 'distribute'>('overview')
  const [normalTax, setNormalTax] = useState('5')
  const [antiSnipeTax, setAntiSnipeTax] = useState('50')
  const [maxTx, setMaxTx] = useState('20000000')
  const [maxWallet, setMaxWallet] = useState('40000000')
  const [addressInput, setAddressInput] = useState('')
  const [pairAddress, setPairAddress] = useState('')
  const [nftFee, setNftFee] = useState('20')
  const [tokenFee, setTokenFee] = useState('40')
  const [treasuryFee, setTreasuryFee] = useState('20')
  const [ammFee, setAmmFee] = useState('20')
  const [minDistribution, setMinDistribution] = useState('100')
  const [roleAddress, setRoleAddress] = useState('')
  const [selectedRole, setSelectedRole] = useState(admin.roles.OPERATOR_ROLE)
  
  // Distribution states
  const [singleRecipient, setSingleRecipient] = useState('')
  const [singleAmount, setSingleAmount] = useState('')
  const [batchRecipients, setBatchRecipients] = useState('')
  const [batchAmounts, setBatchAmounts] = useState('')

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-white/10"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet to access admin controls
          </p>
          <button 
            onClick={connectWallet}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition-all shadow-lg"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    )
  }

  // Wrong network
  if (networkType !== 'evm') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-yellow-500/30"
        >
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Wrong Network
          </h2>
          <p className="text-muted-foreground">
            Admin panel is only available on XRPL EVM Sidechain. Please switch networks.
          </p>
        </motion.div>
      </div>
    )
  }

  // Wrong chain (Mainnet instead of Testnet)
  if (!admin.isCorrectChain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-orange-500/30"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-yellow-500/20">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Wrong Network Detected
          </h2>
          <p className="text-muted-foreground mb-4">
            Contracts are deployed on <strong className="text-yellow-400">XRPL EVM Testnet</strong>
          </p>
          <div className="bg-black/30 rounded-lg p-4 mb-6 text-left text-sm font-mono">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Current Chain:</span>
              <span className="text-red-400">{admin.currentChainId} (0x{admin.currentChainId?.toString(16)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Required Chain:</span>
              <span className="text-green-400">{admin.expectedChainId} (0x{admin.expectedChainId.toString(16)})</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Please switch to <strong className="text-yellow-400">Testnet</strong> to access the admin panel
          </p>
          <button 
            onClick={handleSwitchToTestnet}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg mb-4"
          >
            Switch to Testnet
          </button>
          <div className="flex flex-col space-y-2">
            <div className="text-xs text-gray-400 flex items-center justify-center space-x-2">
              <Zap className="w-3 h-3" />
              <span>Or use the globe icon (🌐) in the navigation to switch manually</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // No admin role
  if (!admin.hasAnyRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-3xl max-w-md w-full border border-red-500/30"
        >
          <Ban className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-4">
            You don't have admin privileges for this contract.
          </p>
          <p className="text-xs text-muted-foreground">
            Required roles: Admin, Operator, or Fee Manager
          </p>
        </motion.div>
      </div>
    )
  }

  // Helper functions
  const handleAddToWhitelist = async () => {
    if (!addressInput) {
      toast.error('Please enter an address')
      return
    }
    const addresses = addressInput.split(',').map(a => a.trim() as `0x${string}`)
    await admin.addToWhitelist(addresses)
    setAddressInput('')
  }

  const handleBlacklist = async () => {
    if (!addressInput) {
      toast.error('Please enter an address')
      return
    }
    const addresses = addressInput.split(',').map(a => a.trim() as `0x${string}`)
    await admin.blacklistAddresses(addresses)
    setAddressInput('')
  }

  const handleUpdateTax = async () => {
    await admin.updateTaxRates(parseFloat(normalTax), parseFloat(antiSnipeTax))
  }

  const handleUpdateLimits = async () => {
    await admin.updateLimits(maxTx, maxWallet)
  }

  const handleUpdateFees = async () => {
    const total = parseFloat(nftFee) + parseFloat(tokenFee) + parseFloat(treasuryFee) + parseFloat(ammFee)
    if (total !== 100) {
      toast.error('Fees must total 100%')
      return
    }
    await admin.updateFeeConfig(
      parseFloat(nftFee),
      parseFloat(tokenFee),
      parseFloat(treasuryFee),
      parseFloat(ammFee)
    )
  }

  const handleGrantRole = async () => {
    if (!roleAddress) {
      toast.error('Please enter an address')
      return
    }
    await admin.grantRole(selectedRole, roleAddress as `0x${string}`)
    setRoleAddress('')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'distribute', label: 'Distribute Tokens', icon: Zap },
    { id: 'token', label: 'Token Config', icon: Settings },
    { id: 'fees', label: 'Fee Management', icon: DollarSign },
    { id: 'access', label: 'Access Control', icon: Users },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  ] as const

  // Handle single transfer
  const handleSingleTransfer = async () => {
    if (!singleRecipient || !singleAmount) {
      toast.error('Please fill in all fields')
      return
    }
    
    // Check balance
    const currentBalance = parseFloat(balance || '0')
    const amountToSend = parseFloat(singleAmount)
    
    if (amountToSend > currentBalance) {
      toast.error(`Insufficient balance! You have ${currentBalance.toLocaleString()} DRIPPY but trying to send ${amountToSend.toLocaleString()} DRIPPY`)
      return
    }
    
    if (amountToSend <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    const success = await transfer(singleRecipient as `0x${string}`, singleAmount)
    if (success) {
      setSingleRecipient('')
      setSingleAmount('')
      await refetchBalance()
    }
  }

  // Handle batch transfer
  const handleBatchTransfer = async () => {
    const recipients = batchRecipients.split('\n').filter(r => r.trim())
    const amounts = batchAmounts.split('\n').filter(a => a.trim())
    
    if (recipients.length === 0 || amounts.length === 0) {
      toast.error('Please provide recipients and amounts')
      return
    }
    
    if (recipients.length !== amounts.length) {
      toast.error('Number of recipients must match number of amounts')
      return
    }
    
    // Check total amount vs balance
    const currentBalance = parseFloat(balance || '0')
    const totalAmount = amounts.reduce((sum, val) => sum + parseFloat(val || '0'), 0)
    
    if (totalAmount > currentBalance) {
      toast.error(`Insufficient balance! Total to send: ${totalAmount.toLocaleString()} DRIPPY, Your balance: ${currentBalance.toLocaleString()} DRIPPY`)
      return
    }
    
    toast('Batch transfers require multiple transactions. Please confirm each one.', {
      icon: '⚡',
      duration: 4000
    })
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].trim()
      const amount = amounts[i].trim()
      
      if (recipient && amount) {
        await transfer(recipient as `0x${string}`, amount)
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    setBatchRecipients('')
    setBatchAmounts('')
    await refetchBalance()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-400" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentNetwork.displayName} • Manage DRIPPY Ecosystem
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {admin.isDefaultAdmin && (
            <span className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold flex items-center space-x-1">
              <Crown className="w-4 h-4" />
              <span>Owner</span>
            </span>
          )}
          {admin.isOperator && (
            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold">
              Operator
            </span>
          )}
          {admin.isFeeManager && (
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
              Fee Manager
            </span>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`card-elevated p-4 rounded-xl border ${admin.isPaused ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Token Status</p>
              <p className={`text-lg font-bold ${admin.isPaused ? 'text-red-400' : 'text-green-400'}`}>
                {admin.isPaused ? 'Paused' : 'Active'}
              </p>
            </div>
            {admin.isPaused ? <Lock className="w-6 h-6 text-red-400" /> : <Unlock className="w-6 h-6 text-green-400" />}
          </div>
        </div>

        <div className="card-elevated p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Anti-Snipe</p>
              <p className={`text-lg font-bold ${tokenInfo?.antiSnipeActive ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                {tokenInfo?.antiSnipeActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Shield className={`w-6 h-6 ${tokenInfo?.antiSnipeActive ? 'text-yellow-400' : 'text-muted-foreground'}`} />
          </div>
        </div>

        <div className="card-elevated p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tax Rate</p>
              <p className="text-lg font-bold text-foreground">{tokenInfo?.normalTax || 5}%</p>
            </div>
            <DollarSign className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        <div className="card-elevated p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Distributions</p>
              <p className="text-lg font-bold text-foreground">{stats?.distributionCount || 0}</p>
            </div>
            <RefreshCw className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-6 rounded-2xl border border-white/5"
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">System Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Token Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Total Supply</span>
                    <span className="font-semibold">{tokenInfo ? parseFloat(tokenInfo.totalSupply).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Circulating</span>
                    <span className="font-semibold">{tokenInfo ? parseFloat(tokenInfo.circulatingSupply).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Accumulated Fees</span>
                    <span className="font-semibold text-cyan-400">{tokenInfo ? parseFloat(tokenInfo.accumulatedFees).toLocaleString() : '0'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Fee Router</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Total Distributed</span>
                    <span className="font-semibold text-green-400">{stats ? parseFloat(stats.totalDistributed).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold">{stats ? parseFloat(stats.pendingDistribution).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Distribution Count</span>
                    <span className="font-semibold">{stats?.distributionCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {!tokenInfo?.antiSnipeActive && admin.isDefaultAdmin && (
                  <button
                    onClick={admin.launch}
                    disabled={admin.isProcessing}
                    className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all"
                  >
                    🚀 Launch Token
                  </button>
                )}
                {tokenInfo?.antiSnipeActive && admin.isDefaultAdmin && (
                  <button
                    onClick={admin.disableAntiSnipe}
                    disabled={admin.isProcessing}
                    className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all"
                  >
                    Disable Anti-Snipe
                  </button>
                )}
                <button
                  onClick={admin.distributeFees}
                  disabled={admin.isProcessing}
                  className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all"
                >
                  Distribute Fees
                </button>
                <button
                  onClick={async () => {
                    await refetchBalance()
                    toast.success('Data refreshed')
                  }}
                  className="p-4 glass hover:bg-white/5 text-foreground rounded-xl font-semibold transition-all"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DISTRIBUTE TOKENS TAB */}
        {activeTab === 'distribute' && (
          <div className="space-y-6">
            <div className="flex items-start space-x-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl mb-6">
              <Zap className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-cyan-400 font-semibold">Distribute DRIPPY Tokens</h4>
                <p className="text-cyan-400/80 text-sm">
                  Send DRIPPY to multiple addresses. Total Supply: 589,000,000 DRIPPY
                </p>
              </div>
            </div>

            {/* Token Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
                <div className="text-2xl font-bold text-foreground">
                  {tokenInfo ? parseFloat(tokenInfo.totalSupply).toLocaleString() : '0'} DRIPPY
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Max: {tokenInfo ? parseFloat(tokenInfo.maxSupply).toLocaleString() : '589,000,000'}
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Your Balance (Deployer)</div>
                <div className="text-2xl font-bold text-foreground">
                  {parseFloat(balance || '0').toLocaleString()} DRIPPY
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </div>
              </div>
            </div>

            {/* Your Balance */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Distribution Wallet Balance:</span>
                  <span className="text-2xl font-bold text-foreground">{parseFloat(balance || '0').toLocaleString()} DRIPPY</span>
                </div>
                {parseFloat(balance || '0') === 0 && parseFloat(tokenInfo?.totalSupply || '0') === 0 && (
                  <div className="flex flex-col space-y-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-400 space-y-2">
                        <div><strong>⚠️ NO TOKENS MINTED!</strong></div>
                        <div>The total supply is 0. No tokens were minted during deployment.</div>
                      </div>
                    </div>
                    <div className="text-sm text-white space-y-2">
                      <div><strong>Solution: Mint Initial Supply</strong></div>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-gray-300">
                        <li>Grant yourself the BRIDGE_ROLE (use Access Control tab)</li>
                        <li>Use bridgeMint function below to mint 589,000,000 DRIPPY</li>
                        <li>Or re-deploy the contract with proper initialization</li>
                      </ol>
                    </div>
                  </div>
                )}
                {parseFloat(balance || '0') === 0 && parseFloat(tokenInfo?.totalSupply || '0') > 0 && (
                  <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-400 space-y-2">
                      <div><strong>Tokens exist but not in your wallet!</strong></div>
                      <div>Total Supply: {tokenInfo ? parseFloat(tokenInfo.totalSupply).toLocaleString() : '0'} DRIPPY</div>
                      <div className="text-xs">Check pool addresses or use the Emergency tab to recover stuck tokens.</div>
                    </div>
                  </div>
                )}
                {parseFloat(balance || '0') > 0 && (
                  <div className="flex items-center space-x-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready to distribute tokens</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Mint Section */}
            {parseFloat(tokenInfo?.totalSupply || '0') === 0 && admin.isDefaultAdmin && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl">
                <h4 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Emergency: Mint Initial Supply</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  No tokens exist. You need to mint the initial supply. As DEFAULT_ADMIN, you can grant yourself BRIDGE_ROLE and mint tokens.
                </p>
                
                <div className="space-y-3">
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Step 1: Grant BRIDGE_ROLE to yourself</div>
                    <button
                      onClick={async () => {
                        if (!address) {
                          toast.error('Wallet not connected')
                          return
                        }
                        const BRIDGE_ROLE = '0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357' // keccak256("BRIDGE_ROLE")
                        await admin.grantRole(BRIDGE_ROLE, address as `0x${string}`)
                      }}
                      disabled={admin.isProcessing || !address}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all"
                    >
                      Grant BRIDGE_ROLE to Self
                    </button>
                  </div>
                  
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Step 2: Mint initial supply to yourself</div>
                    <button
                      onClick={async () => {
                        if (!address) {
                          toast.error('Wallet not connected')
                          return
                        }
                        const success = await admin.bridgeMint(address as `0x${string}`, '589000000')
                        if (success) {
                          await refetchBalance()
                          toast.success('🎉 Successfully minted 589M DRIPPY!')
                        }
                      }}
                      disabled={admin.isProcessing || !address}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all"
                    >
                      {admin.isProcessing ? 'Minting...' : 'Mint 589,000,000 DRIPPY'}
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-yellow-400 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <strong>Note:</strong> This uses bridgeMint which requires BRIDGE_ROLE. After minting, tokens will appear in your wallet and you can distribute them.
                </div>
              </div>
            )}

            {/* Single Transfer */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Single Transfer</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={singleRecipient}
                    onChange={(e) => setSingleRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Amount (DRIPPY)</label>
                  <input
                    type="number"
                    value={singleAmount}
                    onChange={(e) => setSingleAmount(e.target.value)}
                    placeholder="1000000"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>
              <button
                onClick={handleSingleTransfer}
                disabled={isTransferring || !singleRecipient || !singleAmount}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>{isTransferring ? 'Sending...' : 'Send Tokens'}</span>
              </button>
            </div>

            {/* Batch Transfer */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Batch Transfer</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Enter one address per line, and one amount per line. They must match in count.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Recipients (one per line)
                  </label>
                  <textarea
                    value={batchRecipients}
                    onChange={(e) => setBatchRecipients(e.target.value)}
                    placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
                    rows={8}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {batchRecipients.split('\n').filter(r => r.trim()).length} addresses
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Amounts (one per line)
                  </label>
                  <textarea
                    value={batchAmounts}
                    onChange={(e) => setBatchAmounts(e.target.value)}
                    placeholder="1000000&#10;2000000&#10;500000"
                    rows={8}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary text-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {batchAmounts.split('\n').filter(a => a.trim()).length} amounts | Total:{' '}
                    {batchAmounts.split('\n').filter(a => a.trim()).reduce((sum, val) => sum + parseFloat(val || '0'), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleBatchTransfer}
                disabled={isTransferring || !batchRecipients || !batchAmounts}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>{isTransferring ? 'Sending...' : 'Batch Send Tokens'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TOKEN CONFIG TAB */}
        {activeTab === 'token' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Token Configuration</h3>

            {/* Tax Rates */}
            {admin.isFeeManager && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Tax Rates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Normal Tax (%)</label>
                    <input
                      type="number"
                      value={normalTax}
                      onChange={(e) => setNormalTax(e.target.value)}
                      className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Anti-Snipe Tax (%)</label>
                    <input
                      type="number"
                      value={antiSnipeTax}
                      onChange={(e) => setAntiSnipeTax(e.target.value)}
                      className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                      placeholder="50"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateTax}
                  disabled={admin.isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                >
                  {admin.isProcessing ? 'Updating...' : 'Update Tax Rates'}
                </button>
              </div>
            )}

            {/* Transaction Limits */}
            {admin.isDefaultAdmin && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Transaction Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Max Transaction (DRIPPY)</label>
                    <input
                      type="text"
                      value={maxTx}
                      onChange={(e) => setMaxTx(e.target.value)}
                      className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Max Wallet (DRIPPY)</label>
                    <input
                      type="text"
                      value={maxWallet}
                      onChange={(e) => setMaxWallet(e.target.value)}
                      className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateLimits}
                    disabled={admin.isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    {admin.isProcessing ? 'Updating...' : 'Update Limits'}
                  </button>
                  <button
                    onClick={admin.removeLimits}
                    disabled={admin.isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Remove Limits (Permanent)
                  </button>
                </div>
              </div>
            )}

            {/* AMM Pair Management */}
            {admin.isOperator && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">AMM Pair Management</h4>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Pair Address</label>
                  <input
                    type="text"
                    value={pairAddress}
                    onChange={(e) => setPairAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                    placeholder="0x..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => admin.setAMMPair(pairAddress as `0x${string}`, true)}
                    disabled={admin.isProcessing || !pairAddress}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Add Pair
                  </button>
                  <button
                    onClick={() => admin.setAMMPair(pairAddress as `0x${string}`, false)}
                    disabled={admin.isProcessing || !pairAddress}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Remove Pair
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && admin.isFeeManager && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Fee Distribution Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">NFT Pool (%)</label>
                <input
                  type="number"
                  value={nftFee}
                  onChange={(e) => setNftFee(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Token Pool (%)</label>
                <input
                  type="number"
                  value={tokenFee}
                  onChange={(e) => setTokenFee(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Treasury Pool (%)</label>
                <input
                  type="number"
                  value={treasuryFee}
                  onChange={(e) => setTreasuryFee(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">AMM Pool (%)</label>
                <input
                  type="number"
                  value={ammFee}
                  onChange={(e) => setAmmFee(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-sm text-blue-400">
                Total: {parseFloat(nftFee) + parseFloat(tokenFee) + parseFloat(treasuryFee) + parseFloat(ammFee)}%
                {parseFloat(nftFee) + parseFloat(tokenFee) + parseFloat(treasuryFee) + parseFloat(ammFee) !== 100 && (
                  <span className="text-red-400 ml-2">(Must equal 100%)</span>
                )}
              </p>
            </div>

            <button
              onClick={handleUpdateFees}
              disabled={admin.isProcessing}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              {admin.isProcessing ? 'Updating...' : 'Update Fee Distribution'}
            </button>

            {/* Min Distribution */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h4 className="text-lg font-semibold text-foreground">Router Settings</h4>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Min Distribution Amount (DRIPPY)</label>
                <input
                  type="text"
                  value={minDistribution}
                  onChange={(e) => setMinDistribution(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => admin.updateMinDistribution(minDistribution)}
                  disabled={admin.isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                >
                  Update Min Amount
                </button>
                <button
                  onClick={admin.forceDistribute}
                  disabled={admin.isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                >
                  Force Distribute Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACCESS CONTROL TAB */}
        {activeTab === 'access' && admin.isOperator && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Access Control</h3>

            {/* Whitelist */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Whitelist Management</h4>
              <p className="text-sm text-muted-foreground">Add addresses to bypass anti-snipe tax (comma-separated)</p>
              <textarea
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-green-500/50"
                placeholder="0x123..., 0x456..."
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToWhitelist}
                  disabled={admin.isProcessing || !addressInput}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Add to Whitelist</span>
                </button>
                <button
                  onClick={async () => {
                    if (!addressInput) return
                    const addresses = addressInput.split(',').map(a => a.trim() as `0x${string}`)
                    await admin.removeFromWhitelist(addresses)
                    setAddressInput('')
                  }}
                  disabled={admin.isProcessing || !addressInput}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Remove from Whitelist</span>
                </button>
              </div>
            </div>

            {/* Blacklist */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h4 className="text-lg font-semibold text-foreground">Blacklist Management</h4>
              <p className="text-sm text-muted-foreground">Block addresses from trading (comma-separated)</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleBlacklist}
                  disabled={admin.isProcessing || !addressInput}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Ban className="w-5 h-5" />
                  <span>Blacklist</span>
                </button>
                <button
                  onClick={async () => {
                    if (!addressInput) return
                    const addresses = addressInput.split(',').map(a => a.trim() as `0x${string}`)
                    await admin.unblacklistAddresses(addresses)
                    setAddressInput('')
                  }}
                  disabled={admin.isProcessing || !addressInput}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Unblacklist</span>
                </button>
              </div>
            </div>

            {/* Role Management */}
            {admin.isDefaultAdmin && (
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h4 className="text-lg font-semibold text-foreground">Role Management</h4>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Address</label>
                  <input
                    type="text"
                    value={roleAddress}
                    onChange={(e) => setRoleAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value={admin.roles.OPERATOR_ROLE}>Operator</option>
                    <option value={admin.roles.FEE_MANAGER_ROLE}>Fee Manager</option>
                    <option value={admin.roles.DEFAULT_ADMIN_ROLE}>Admin</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleGrantRole}
                    disabled={admin.isProcessing || !roleAddress}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Grant Role
                  </button>
                  <button
                    onClick={() => admin.revokeRole(selectedRole, roleAddress as `0x${string}`)}
                    disabled={admin.isProcessing || !roleAddress}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Revoke Role
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMERGENCY TAB */}
        {activeTab === 'emergency' && admin.isDefaultAdmin && (
          <div className="space-y-6">
            <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-semibold">Danger Zone</h4>
                <p className="text-red-400/80 text-sm">
                  These actions have significant impact. Use with caution.
                </p>
              </div>
            </div>

            {/* Pause Controls */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Contract Controls</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Token Contract</label>
                  {admin.isPaused ? (
                    <button
                      onClick={admin.unpauseToken}
                      disabled={admin.isProcessing}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <Unlock className="w-5 h-5" />
                      <span>Unpause Token</span>
                    </button>
                  ) : (
                    <button
                      onClick={admin.pauseToken}
                      disabled={admin.isProcessing}
                      className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Pause Token</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Fee Router</label>
                  {admin.isRouterPaused ? (
                    <button
                      onClick={admin.unpauseRouter}
                      disabled={admin.isProcessing}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <Unlock className="w-5 h-5" />
                      <span>Unpause Router</span>
                    </button>
                  ) : (
                    <button
                      onClick={admin.pauseRouter}
                      disabled={admin.isProcessing}
                      className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Pause Router</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Admin
