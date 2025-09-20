import React from 'react'
import { motion } from 'framer-motion'
import { Image, Star, Clock, TrendingUp } from 'lucide-react'

const NFTPage: React.FC = () => {
  const nfts = [
    {
      id: 1,
      name: 'Drippy Drop #001',
      image: '/api/placeholder/300/300',
      rarity: 'Legendary',
      rewards: '15.5 DRIPPY/day',
      price: '2.5 XRP',
      lastSale: '3.2 XRP'
    },
    {
      id: 2,
      name: 'Drippy Drop #002',
      image: '/api/placeholder/300/300',
      rarity: 'Epic',
      rewards: '12.3 DRIPPY/day',
      price: '1.8 XRP',
      lastSale: '2.1 XRP'
    },
    {
      id: 3,
      name: 'Drippy Drop #003',
      image: '/api/placeholder/300/300',
      rarity: 'Rare',
      rewards: '8.7 DRIPPY/day',
      price: '1.2 XRP',
      lastSale: '1.5 XRP'
    },
    {
      id: 4,
      name: 'Drippy Drop #004',
      image: '/api/placeholder/300/300',
      rarity: 'Common',
      rewards: '5.2 DRIPPY/day',
      price: '0.8 XRP',
      lastSale: '1.0 XRP'
    },
    {
      id: 5,
      name: 'Drippy Drop #005',
      image: '/api/placeholder/300/300',
      rarity: 'Epic',
      rewards: '11.8 DRIPPY/day',
      price: '2.1 XRP',
      lastSale: '2.3 XRP'
    },
    {
      id: 6,
      name: 'Drippy Drop #006',
      image: '/api/placeholder/300/300',
      rarity: 'Rare',
      rewards: '9.1 DRIPPY/day',
      price: '1.5 XRP',
      lastSale: '1.8 XRP'
    }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-400 bg-yellow-400/20'
      case 'Epic': return 'text-purple-400 bg-purple-400/20'
      case 'Rare': return 'text-blue-400 bg-blue-400/20'
      case 'Common': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">NFT Gallery</h1>
        <p className="text-gray-400 mt-1">
          Discover and trade Drippy NFTs with unique reward rates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Image className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total NFTs</p>
              <p className="text-2xl font-bold text-white">1,234</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Floor Price</p>
              <p className="text-2xl font-bold text-white">0.8 XRP</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Star className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Volume 24h</p>
              <p className="text-2xl font-bold text-white">45.2 XRP</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Rewards</p>
              <p className="text-2xl font-bold text-white">8.5/day</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">
          All
        </button>
        <button className="px-4 py-2 glass text-gray-300 hover:text-white rounded-lg">
          Legendary
        </button>
        <button className="px-4 py-2 glass text-gray-300 hover:text-white rounded-lg">
          Epic
        </button>
        <button className="px-4 py-2 glass text-gray-300 hover:text-white rounded-lg">
          Rare
        </button>
        <button className="px-4 py-2 glass text-gray-300 hover:text-white rounded-lg">
          Common
        </button>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft, index) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl overflow-hidden hover:shadow-drip transition-all duration-300 group"
          >
            <div className="aspect-square bg-gradient-to-br from-primary-500/20 to-accent-500/20 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 drip-gradient rounded-full flex items-center justify-center">
                  <span className="text-3xl">💧</span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)}`}>
                  {nft.rarity}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">{nft.name}</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Daily Rewards</span>
                  <span className="text-primary-400 font-medium">{nft.rewards}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">{nft.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Sale</span>
                  <span className="text-green-400 font-medium">{nft.lastSale}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                  Buy Now
                </button>
                <button className="px-4 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors">
                  View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default NFTPage
