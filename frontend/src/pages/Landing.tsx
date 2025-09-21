import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, Droplets, Sparkles, TrendingUp, Shield, Zap, Users, DollarSign, BarChart3, ArrowRight, Star, Globe } from 'lucide-react'

// Animated counter component
const CounterAnimation: React.FC<{ target: number; suffix?: string; prefix?: string }> = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        const increment = target / 100
        const next = prev + increment
        return next >= target ? target : next
      })
    }, 30)

    return () => clearInterval(timer)
  }, [target])

  return (
    <span>{prefix}{Math.floor(count).toLocaleString()}{suffix}</span>
  )
}

// Floating droplet component
const FloatingDroplet: React.FC<{ delay: number; size: string; position: string }> = ({ delay, size, position }) => {
  return (
    <motion.div
      className={`absolute ${position} ${size} drip-gradient rounded-full opacity-20 pointer-events-none`}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

const Landing: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const features = [
    {
      icon: Zap,
      title: 'XRPL Hooks',
      desc: 'Lightning-fast transactions with minimal fees',
      detail: 'Built on the XRP Ledger for maximum efficiency'
    },
    {
      icon: TrendingUp,
      title: 'Auto Rewards',
      desc: 'Passive income that compounds automatically',
      detail: 'Earn rewards 24/7 without manual claiming'
    },
    {
      icon: Star,
      title: 'NFT Boosts',
      desc: 'Unlock premium perks and multipliers',
      detail: 'Exclusive NFTs that amplify your earnings'
    },
  ]

  const stats = [
    { label: 'Total Rewards Paid', value: 1253420, suffix: ' DRIPPY', icon: DollarSign },
    { label: 'Active Users', value: 12847, suffix: '', icon: Users },
    { label: 'APY Range', value: 18.5, suffix: '%', icon: BarChart3 },
    { label: 'TVL', value: 2.4, suffix: 'M', prefix: '$', icon: Globe },
  ]

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Floating droplets background */}
      <FloatingDroplet delay={0} size="w-16 h-16" position="top-20 left-10" />
      <FloatingDroplet delay={1} size="w-8 h-8" position="top-40 right-20" />
      <FloatingDroplet delay={2} size="w-12 h-12" position="top-60 left-1/4" />
      <FloatingDroplet delay={3} size="w-6 h-6" position="bottom-40 right-10" />
      <FloatingDroplet delay={1.5} size="w-10 h-10" position="bottom-20 left-1/3" />

      {/* Enhanced Hero Section */}
      <section className="relative py-24 sm:py-32">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-96 h-96 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-primary-500 via-turquoise-500 to-accent-500 animate-pulse-slow" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-35 bg-gradient-to-tl from-accent-500 to-primary-500 animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-turquoise-400 to-accent-400" />
          <div className="absolute top-20 right-1/4 w-48 h-48 rounded-full blur-2xl opacity-25 bg-gradient-to-br from-primary-400 to-turquoise-400 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full glass border border-primary-500/30 text-primary-200 mb-8 backdrop-blur-xl bg-primary-500/10">
                <Sparkles className="w-5 h-5 animate-pulse text-accent-400" />
                <span className="text-sm font-medium text-primary-100">Powered by XRPL Hooks Technology</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 bg-accent-400 rounded-full"
                />
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 drip-gradient rounded-full blur-2xl opacity-30 animate-pulse-slow"></div>
                  <img
                    src="/drippylogo.png"
                    alt="Drippy Logo"
                    className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-2xl"
                  />
                </motion.div>

                <div className="text-center lg:text-left">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                    <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                      Drippy
                    </span>
                    <br />
                    <span className="text-muted-foreground">DeFi Rewards</span>
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed">
                Experience the next generation of DeFi rewards on XRPL. Earn, track, and claim rewards in real-time
                with seamless wallet connectivity, NFT utility, and comprehensive analytics.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center justify-center px-8 py-4 rounded-xl drip-gradient hover:opacity-90 text-primary-foreground font-semibold transition-all duration-300 shadow-lg shadow-drip hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Droplets className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                    Launch Drippy App
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href="https://xumm.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center justify-center px-8 py-4 rounded-xl glass border border-accent/40 text-foreground hover:text-accent hover:bg-accent/10 transition-all duration-300 backdrop-blur-xl hover:border-accent/60"
                  >
                    <Wallet className="w-5 h-5 mr-3" />
                    Get Xaman Wallet
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * (idx + 1), duration: 0.6 }}
                onHoverStart={() => setHoveredFeature(idx)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="relative group"
              >
                <div className="glass rounded-2xl p-6 border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-xl hover:bg-white/15 transform hover:-translate-y-2">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl drip-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {hoveredFeature === idx ? feature.detail : feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Stats Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="glass rounded-3xl p-8 border-white/20 shadow-drip backdrop-blur-xl"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Platform Analytics</h2>
              <p className="text-gray-400">Real-time metrics from the Drippy ecosystem</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + (idx * 0.1), duration: 0.5 }}
                  className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-400 group-hover:text-primary-300 transition-colors" />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    <CounterAnimation
                      target={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Live Analytics Preview */}
            <div className="h-48 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 animate-pulse" />
              <div className="relative z-10 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Live Analytics Dashboard</h3>
                <p className="text-gray-400 text-sm">Interactive charts and real-time data visualization</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative border-t border-white/20 py-12">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full drip-gradient flex items-center justify-center">
                <Droplets className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-foreground font-semibold">Drippy</span>
            </div>
            <div className="text-center text-gray-400">
              <p>© {new Date().getFullYear()} Drippy — Revolutionizing DeFi on XRPL</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Shield className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-gray-400">Secured by XRPL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

