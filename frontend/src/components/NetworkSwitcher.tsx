import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Zap, CheckCircle, Droplets, FlaskConical } from 'lucide-react'
import { useNetwork } from '../contexts/NetworkContext'
import { AVAILABLE_NETWORKS, NetworkConfig } from '../types/network'

interface NetworkSwitcherProps {
  compact?: boolean
  position?: 'normal' | 'bottom'
  sidebarCollapsed?: boolean
}

const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ compact = false, position = 'normal', sidebarCollapsed = false }) => {
  const { currentNetwork, switchNetwork, environment, toggleEnvironment } = useNetwork()
  const [isOpen, setIsOpen] = useState(false)

  const getStatusIcon = (network: NetworkConfig) => {
    if (network.type === 'xrpl') {
      return <Droplets className="w-3 h-3 text-blue-400" />
    } else {
      return <Zap className="w-3 h-3 text-purple-400" />
    }
  }

  const getNetworkColor = (network: NetworkConfig) => {
    if (network.type === 'xrpl') {
      return network.environment === 'mainnet' ? 'text-blue-400' : 'text-cyan-400'
    } else {
      return network.environment === 'mainnet' ? 'text-purple-400' : 'text-pink-400'
    }
  }



  const DropdownContent = () => (
    <div className="p-3">
      {/* Environment Toggle */}
      <div className="mb-3 px-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Environment</h3>
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              toggleEnvironment()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              environment === 'mainnet'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {environment === 'testnet' && <FlaskConical className="w-3 h-3" />}
            {environment === 'mainnet' && <CheckCircle className="w-3 h-3" />}
            <span>{environment === 'mainnet' ? 'Mainnet' : 'Testnet'}</span>
          </motion.button>
        </div>
      </div>

      <div className="mb-3 px-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Network Type</h3>
      </div>

      <div className="space-y-1">
        {AVAILABLE_NETWORKS.filter(n => n.environment === environment).map((network) => (
          <motion.button
            key={network.name}
            onClick={() => {
              switchNetwork(network)
              setIsOpen(false)
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all duration-200 ${
              currentNetwork.name === network.name
                ? 'bg-primary-500/20 border border-primary-500/30'
                : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className={`text-lg ${getNetworkColor(network)}`}>
                  {network.icon}
                </span>
                {getStatusIcon(network)}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {network.displayName}
                </div>
                <div className="text-xs text-gray-400">{network.description}</div>
              </div>
            </div>

            {currentNetwork.name === network.name && (
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
          <span className="text-xs text-gray-400">
            {currentNetwork.displayName} ({environment})
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <motion.button
        onClick={() => {
          console.log('Network switcher toggle:', !isOpen, { compact, position, sidebarCollapsed })
          setIsOpen(!isOpen)
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center rounded-lg glass border text-white/90 transition-all duration-300 backdrop-blur-xl cursor-pointer ${
          isOpen
            ? 'border-primary/60 bg-primary/20'
            : 'border-white/20 hover:border-white/40 hover:text-white'
        } ${
          compact && sidebarCollapsed && position === 'bottom'
            ? 'w-12 h-12 p-2 justify-center'
            : compact
            ? 'w-8 h-8 p-1 justify-center'
            : 'space-x-1 px-2 py-1.5 text-xs'
        }`}
      >
        <Globe className="w-4 h-4" />
        {!compact && (
          <>
            {getStatusIcon(currentNetwork)}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[9998] ${sidebarCollapsed && position === 'bottom' ? 'bg-black/50' : ''}`}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{
                opacity: 0,
                scale: 0.9
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              data-network-dropdown
              className={`glass rounded-xl border border-white/20 backdrop-blur-xl shadow-2xl ${
                position === 'bottom'
                  ? 'absolute z-[9999] w-56 bottom-full left-0 mb-2'
                  : compact
                  ? 'absolute z-[9999] w-56 top-full left-0 mt-2'
                  : 'absolute z-[9999] w-56 top-full right-0 mt-2'
              }`}
            >
              <DropdownContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NetworkSwitcher