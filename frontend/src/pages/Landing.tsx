import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Spline from '@splinetool/react-spline'
import { 
  Wallet, Droplets, TrendingUp, Shield, ArrowRight,
  Coins, Image, Sparkles, Globe, Layers,
  ExternalLink, Twitter, Copy, ChevronDown
} from 'lucide-react'

const Landing: React.FC = () => {
  const [splineLoaded, setSplineLoaded] = useState(false)

  const scrollToContent = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSplineLoad = () => {
    setSplineLoaded(true)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section with Spline Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Spline 3D Background - Full Screen */}
        <div className="absolute inset-0 z-0">
          {/* Loading state - shown while Spline loads */}
          {!splineLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10">
              {/* Animated loading orbs */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.15, 0.3, 0.15],
                  rotate: [360, 180, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
              />
              
              {/* Loading indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 opacity-50">
                  <Droplets className="w-16 h-16 mx-auto text-blue-400 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Loading 3D scene...</p>
                </div>
              </div>
            </div>
          )}

          {/* Spline Scene - Mobile Responsive */}
          <div className="absolute inset-0 w-full h-full">
            <Spline
              scene="https://prod.spline.design/uef8yvxWnGXGXFeR/scene.splinecode"
              onLoad={handleSplineLoad}
              className="w-full h-full"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
          </div>
          
          {/* Vignette overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
          
          {/* Mobile: Add stronger vignette for better readability */}
          <div className="absolute inset-0 md:hidden bg-black/20 pointer-events-none" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="inline-flex items-center space-x-2 px-6 py-3 glass rounded-full border border-white/30 mb-8 backdrop-blur-xl"
            >
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Multi-Chain DeFi • XRPL + EVM Sidechain
              </span>
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            </motion.div>

            {/* Main Hero Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-6xl md:text-8xl font-black mb-6 leading-tight"
            >
              <span className="block text-foreground mb-2">DeFi Done</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Different
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light"
            >
              Trade, stake & earn across <span className="text-blue-400 font-semibold">XRPL Mainnet</span> + <span className="text-purple-400 font-semibold">EVM Sidechain</span>
              <br />
              <span className="text-sm mt-2 inline-block opacity-80">Two chains. One token. Infinite possibilities.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                >
                  <Droplets className="w-5 h-5" />
                  <span>Launch App</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              
              <Link to="/nft">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 px-8 py-4 glass border border-white/30 hover:border-white/50 backdrop-blur-xl text-foreground font-bold rounded-xl transition-all"
                >
                  <Image className="w-5 h-5" />
                  <span>View NFTs</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              <div className="flex items-center space-x-2 px-6 py-3 glass rounded-full border border-blue-500/30 backdrop-blur-xl">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">XRPL Native</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 glass rounded-full border border-purple-500/30 backdrop-blur-xl">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">EVM Compatible</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 glass rounded-full border border-pink-500/30 backdrop-blur-xl">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-muted-foreground">589 Utility NFTs</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.button
            onClick={scrollToContent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 1.5 }, y: { duration: 2, repeat: Infinity } }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="w-8 h-8" />
          </motion.button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Why Drippy?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built different. Dual-chain architecture unlocks DeFi features<br />
              <span className="text-sm opacity-80">that single-chain projects can only dream about</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'True Multi-Chain',
                description: 'Seamlessly operate on both XRPL and EVM. Switch networks with one click, manage everything from a unified dashboard.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Shield,
                title: 'Battle-Tested & Secure',
                description: 'Audited smart contracts on EVM, native XRPL integration. Your assets stay safe while you chase those gains.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Sparkles,
                title: '589 Utility NFTs',
                description: 'Not your average jpegs. OG holders get 5x staking multipliers, governance rights, exclusive airdrops, and priority access.',
                gradient: 'from-pink-500 to-rose-500'
              },
              {
                icon: TrendingUp,
                title: 'Full DeFi Stack',
                description: 'AMM trading, liquidity pools, token swaps across both chains. All the DeFi features you need in one place.',
                gradient: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Layers,
                title: 'Complete Ecosystem',
                description: 'Staking, governance, NFT marketplace, analytics. Everything you need to build wealth across two chains.',
                gradient: 'from-violet-500 to-purple-500'
              },
              {
                icon: Wallet,
                title: 'Unified Experience',
                description: 'One interface for all your assets. Connect Xaman for XRPL, MetaMask for EVM. Dead simple.',
                gradient: 'from-rose-500 to-pink-500'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all`} />
                <div className="relative glass rounded-2xl border border-white/20 p-8 hover:border-white/40 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NFT Section */}
      <section className="relative z-10 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold mb-4">
                589 OG Collection
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                NFTs With Real<br />Utility
              </h2>
              <p className="text-xl text-muted-foreground mb-4">
                These aren't just collectibles. Every NFT unlocks tangible benefits across both XRPL and EVM chains.
              </p>
              <p className="text-base text-muted-foreground mb-8 opacity-80">
                Hold an OG Drippy NFT and get boosted rewards, governance power, and exclusive access to new features first.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  { text: '5x staking multipliers on rewards', emoji: '🚀' },
                  { text: 'Boosted voting power in governance', emoji: '🗳️' },
                  { text: 'Exclusive airdrops and early access', emoji: '💎' },
                  { text: 'Priority support and beta features', emoji: '⚡' }
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <span>{benefit.emoji}</span>
                    </div>
                    <span className="text-foreground">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link to="/nft">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-accent to-pink-500 hover:from-accent/90 hover:to-pink-500/90 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <Image className="w-5 h-5" />
                  <span>Explore Collection</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-3xl p-6 border border-white/20">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="aspect-square bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl overflow-hidden"
                    >
                      <img
                        src={`/nfts/${i}.webp`}
                        alt={`OG NFT #${i}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Token Info */}
      <section className="relative z-10 py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-3xl border border-white/20 p-8 md:p-12 text-center"
          >
            <Coins className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h3 className="text-3xl font-bold text-foreground mb-2">$DRIPPY Token</h3>
            <p className="text-sm text-muted-foreground mb-6">The multi-chain DeFi token on XRPL & EVM</p>
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-muted rounded-xl mb-6">
              <code className="text-primary font-mono text-sm">rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ</code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  navigator.clipboard.writeText('rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ')
                }}
                className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                title="Copy address"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>
            <p className="text-muted-foreground mb-8">
              Official DRIPPY token contract on XRPL Mainnet. Set up your trustline to start trading and earning rewards.
            </p>
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-8 py-4 drip-gradient text-white font-bold rounded-xl transition-all shadow-lg"
              >
                <Droplets className="w-5 h-5" />
                <span>Set Up Trustline</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Connect your wallet and start using DeFi across XRPL & EVM<br />
              <span className="text-sm opacity-80">Choose your chain, then dive in</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Launch App</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/drippylogo.png" alt="Drippy" className="w-8 h-8 object-contain" />
              <span className="text-foreground font-bold text-lg">Drippy</span>
              <span className="text-xs text-muted-foreground">Multi-Chain DeFi</span>
            </div>

            <div className="flex items-center space-x-6">
              <a 
                href="https://twitter.com/drippyxrp" 
                target="_blank" 
                rel="noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://xumm.app" 
                target="_blank" 
                rel="noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Get Xaman Wallet"
              >
                <Wallet className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Documentation"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} Drippy — Multi-Chain DeFi on XRPL
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
