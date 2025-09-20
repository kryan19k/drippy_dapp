import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  LayoutDashboard,
  Image,
  BarChart3,
  Gavel,
  Wallet,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import { useXRPL } from '../contexts/XRPLContext'
import ThemePicker from './ThemePicker'
import NetworkSwitcher from './NetworkSwitcher'

interface NavigationProps {
  layout?: 'top' | 'sidebar'
  className?: string
}

const navigation = [
  { name: 'Home', href: '/', icon: Home, requiresAuth: false },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresAuth: false },
  { name: 'NFT Gallery', href: '/nft', icon: Image, requiresAuth: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiresAuth: false },
  { name: 'Governance', href: '/governance', icon: Gavel, requiresAuth: false },
  { name: 'Admin', href: '/admin', icon: Shield, requiresAuth: true, adminOnly: true },
]

const Navigation: React.FC<NavigationProps> = ({ layout = 'top', className = '' }) => {
  const location = useLocation()
  const { isConnected, account, connectWallet, disconnectWallet } = useXRPL()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  // Determine if we should use sidebar layout based on route
  const shouldUseSidebar = layout === 'sidebar' || (layout === 'top' && location.pathname !== '/')

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const WalletSection = () => (
    <div className="flex items-center space-x-3">
      {isConnected ? (
        <div className="relative">
          <motion.button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all duration-300"
          >
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
            </span>
            <User className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setUserMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 z-[9999] w-64 glass rounded-xl border border-white/20 backdrop-blur-xl shadow-xl"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">Connected</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {account ? `${account.slice(0, 12)}...${account.slice(-8)}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Account Settings</span>
                      </button>
                      <button
                        onClick={disconnectWallet}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Disconnect</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button
          onClick={connectWallet}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-turquoise-500 hover:from-primary-400 hover:to-turquoise-400 text-white rounded-lg transition-all duration-300 shadow-lg shadow-primary-500/25"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </motion.button>
      )}
    </div>
  )

  const LogoSection = () => (
    <Link to="/" className="flex items-center space-x-3 group">
      <div className="relative">
        <img
          src="/drippylogo.png"
          alt="Drippy Logo"
          className="w-10 h-10 object-contain transition-transform group-hover:scale-110 duration-300"
        />
      </div>
      {(!shouldUseSidebar || !isSidebarCollapsed) && (
        <span className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
          Drippy
        </span>
      )}
    </Link>
  )

  if (shouldUseSidebar) {
    // Sidebar Layout
    return (
      <>
        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-[40] glass border-r border-white/10 backdrop-blur-xl transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          } ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <LogoSection />
            <motion.button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg glass border border-white/20 hover:border-white/40 transition-all"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-white" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-white" />
              )}
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigation
                .filter(item => !item.requiresAuth || isConnected)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(item.href)
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isSidebarCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  )
                })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 space-y-3">
            {!isSidebarCollapsed && (
              <>
                <div className="flex items-center space-x-3">
                  <ThemePicker />
                  <NetworkSwitcher />
                </div>
                <WalletSection />
              </>
            )}
            {isSidebarCollapsed && (
              <div className="flex flex-col space-y-3 items-center">
                <ThemePicker />
                <NetworkSwitcher />
                <div className="w-full">
                  <WalletSection />
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-[50] glass border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between p-4">
            <LogoSection />
            <div className="flex items-center space-x-3">
              <ThemePicker />
              <NetworkSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-[9990]"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="lg:hidden fixed left-0 top-0 h-full w-80 glass backdrop-blur-xl border-r border-white/10 z-[9995]"
              >
                <div className="p-6">
                  <LogoSection />
                </div>

                <nav className="px-4">
                  <div className="space-y-2">
                    {navigation
                      .filter(item => !item.requiresAuth || isConnected)
                      .map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                              isActive(item.href)
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        )
                      })}
                  </div>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                  <WalletSection />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Top Navigation Layout (for landing page)
  return (
    <header className={`glass border-b border-white/10 backdrop-blur-xl relative z-[50] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <LogoSection />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation
              .filter(item => !item.requiresAuth || isConnected)
              .map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <ThemePicker />
              <NetworkSwitcher />
            </div>
            <WalletSection />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 backdrop-blur-xl relative z-[9999]"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <ThemePicker />
                <NetworkSwitcher />
              </div>

              <div className="space-y-2">
                {navigation
                  .filter(item => !item.requiresAuth || isConnected)
                  .map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive(item.href)
                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navigation