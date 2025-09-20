import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Zap, AlertTriangle, CheckCircle } from 'lucide-react'

interface Network {
  id: string
  name: string
  shortName: string
  status: 'active' | 'maintenance' | 'inactive'
  color: string
  description: string
}

const networks: Network[] = [
  {
    id: 'mainnet',
    name: 'XRPL Mainnet',
    shortName: 'Mainnet',
    status: 'active',
    color: 'text-green-400',
    description: 'Production network'
  },
  {
    id: 'testnet',
    name: 'XRPL Testnet',
    shortName: 'Testnet',
    status: 'active',
    color: 'text-yellow-400',
    description: 'Testing environment'
  },
  {
    id: 'devnet',
    name: 'XRPL Devnet',
    shortName: 'Devnet',
    status: 'maintenance',
    color: 'text-orange-400',
    description: 'Development network'
  },
  {
    id: 'sidechain',
    name: 'XRPL Sidechain',
    shortName: 'Sidechain',
    status: 'inactive',
    color: 'text-gray-400',
    description: 'Experimental sidechain'
  },
]

const NetworkSwitcher: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0])
  const [isOpen, setIsOpen] = useState(false)

  const getStatusIcon = (status: Network['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'maintenance':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />
      case 'inactive':
        return <div className="w-3 h-3 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg glass border border-white/20 hover:border-white/40 text-white/90 hover:text-white transition-all duration-300 backdrop-blur-xl text-xs"
      >
        <Globe className="w-3 h-3" />
        {getStatusIcon(selectedNetwork.status)}
        <ChevronDown className={`w-2 h-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 right-20 z-[9999] w-56 glass rounded-lg border border-white/20 backdrop-blur-xl shadow-xl"
            >
              <div className="p-3">
                <div className="mb-2 px-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Network</h3>
                </div>

                <div className="space-y-1">
                  {networks.map((network) => (
                    <motion.button
                      key={network.id}
                      onClick={() => {
                        setSelectedNetwork(network)
                        setIsOpen(false)
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={network.status === 'inactive'}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                        selectedNetwork.id === network.id
                          ? 'bg-primary-500/20 border border-primary-500/30'
                          : network.status === 'inactive'
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Zap className={`w-4 h-4 ${network.color}`} />
                          {getStatusIcon(network.status)}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${
                            network.status === 'inactive' ? 'text-gray-500' : 'text-white'
                          }`}>
                            {network.name}
                          </div>
                          <div className="text-xs text-gray-400">{network.description}</div>
                        </div>
                      </div>

                      {selectedNetwork.id === network.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-primary-400"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Connected to {selectedNetwork.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NetworkSwitcher