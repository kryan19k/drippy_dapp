import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Droplets,
  Plus,
  Minus,
  AlertCircle,
  Coins
} from 'lucide-react'
import { useEVM } from '../contexts/EVMContext'
import { useNetwork } from '../contexts/NetworkContext'
import toast from 'react-hot-toast'

const Liquidity: React.FC = () => {
  const { networkType, environment } = useNetwork()
  const { isConnected, balance, connectWallet } = useEVM()

  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add')
  const [token0Amount, setToken0Amount] = useState('')
  const [token1Amount, setToken1Amount] = useState('')

  const handleAddLiquidity = () => {
    if (!token0Amount || !token1Amount) {
      toast.error('Please enter both amounts')
      return
    }
    toast.success('Liquidity addition coming soon! 🚀')
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20">
            <Droplets className="w-10 h-10 text-pink-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Liquidity Pools
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your Web3 wallet to provide liquidity and earn fees
          </p>
          <motion.button 
            onClick={connectWallet} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
          >
            Connect Web3 Wallet
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          <Droplets className="w-8 h-8 text-pink-400" />
          <span>Liquidity Pools</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Provide liquidity and earn trading fees • {environment}
        </p>
      </div>

      {/* Network Warning */}
      {networkType !== 'evm' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">Wrong Network</p>
            <p className="text-yellow-400/80 text-sm">
              Liquidity pools are only available on XRPL EVM Sidechain. Please switch networks.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liquidity Management Card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Tab Headers */}
            <div className="flex border-b border-white/5">
              {(['add', 'remove'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-semibold capitalize transition-all flex items-center justify-center space-x-2 ${
                    activeTab === tab
                      ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-500/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {tab === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  <span>{tab === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'add' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Token 0 */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Token 1</label>
                    <div className="p-4 bg-muted rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <select
                          className="bg-transparent text-lg font-semibold text-foreground focus:outline-none"
                        >
                          <option value="XRP">XRP</option>
                          <option value="DRIPPY">DRIPPY</option>
                          <option value="USDC">USDC</option>
                        </select>
                        <span className="text-sm text-muted-foreground">
                          Balance: {balance || '0.00'}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={token0Amount}
                        onChange={(e) => setToken0Amount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Plus Icon */}
                  <div className="flex justify-center">
                    <div className="p-2 bg-card border border-white/10 rounded-xl">
                      <Plus className="w-5 h-5 text-pink-400" />
                    </div>
                  </div>

                  {/* Token 1 */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Token 2</label>
                    <div className="p-4 bg-muted rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <select
                          className="bg-transparent text-lg font-semibold text-foreground focus:outline-none"
                        >
                          <option value="DRIPPY">DRIPPY</option>
                          <option value="XRP">XRP</option>
                          <option value="USDC">USDC</option>
                        </select>
                        <span className="text-sm text-muted-foreground">
                          Balance: 0.00
                        </span>
                      </div>
                      <input
                        type="number"
                        value={token1Amount}
                        onChange={(e) => setToken1Amount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pool Info */}
                  <div className="p-4 bg-pink-500/5 rounded-xl border border-pink-500/20 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pool Share</span>
                      <span className="text-foreground font-medium">0.00%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">LP Tokens to Receive</span>
                      <span className="text-foreground font-medium">0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee Tier</span>
                      <span className="text-green-400 font-medium">0.3%</span>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddLiquidity}
                    className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg"
                  >
                    Add Liquidity
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Liquidity pools coming soon. This is a preview interface.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No liquidity positions</p>
                  <p className="text-sm text-muted-foreground">
                    Add liquidity to start earning fees from trades
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Your Liquidity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Liquidity</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fees Earned (24h)</p>
                <p className="text-lg font-bold text-green-400">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Pools</p>
                <p className="text-lg font-bold text-foreground">0</p>
              </div>
            </div>
          </motion.div>

          {/* Top Pools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Pools</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">XRP/DRIPPY</span>
                  <span className="text-xs text-green-400">18.5% APY</span>
                </div>
                <p className="text-xs text-muted-foreground">TVL: $1.2M</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">XRP/USDC</span>
                  <span className="text-xs text-green-400">12.3% APY</span>
                </div>
                <p className="text-xs text-muted-foreground">TVL: $2.5M</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">DRIPPY/USDC</span>
                  <span className="text-xs text-green-400">25.7% APY</span>
                </div>
                <p className="text-xs text-muted-foreground">TVL: $850K</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Liquidity

