import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Grid, List, SortAsc, SortDesc, Star } from 'lucide-react'
import NFTCard from './NFTCard'

interface NFT {
  tokenID: string
  metadata: {
    name: string
    description: string
    image: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  }
  owner?: string
  rarity: {
    tier: string
    score: number
    sequence: number
  }
  boostMultiplier: number
  estimatedRewards?: number
}

interface NFTGalleryProps {
  nfts: NFT[]
  loading?: boolean
  onNFTClick?: (nft: NFT) => void
  title?: string
  className?: string
}

const NFTGallery: React.FC<NFTGalleryProps> = ({
  nfts = [],
  loading = false,
  onNFTClick,
  title = 'NFT Collection',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('all')
  const [sortBy, setSortBy] = useState<'rarity' | 'sequence' | 'name' | 'boost'>('rarity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredNFTs, setFilteredNFTs] = useState<NFT[]>(nfts)

  // Filter and sort NFTs
  useEffect(() => {
    let filtered = [...nfts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.tokenID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.metadata.attributes?.some(attr =>
          attr.trait_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attr.value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(nft => nft.rarity.tier === selectedRarity)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'rarity':
          aValue = a.rarity.score
          bValue = b.rarity.score
          break
        case 'sequence':
          aValue = a.rarity.sequence
          bValue = b.rarity.sequence
          break
        case 'name':
          aValue = a.metadata.name.toLowerCase()
          bValue = b.metadata.name.toLowerCase()
          break
        case 'boost':
          aValue = a.boostMultiplier
          bValue = b.boostMultiplier
          break
        default:
          aValue = a.rarity.score
          bValue = b.rarity.score
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredNFTs(filtered)
  }, [nfts, searchTerm, selectedRarity, sortBy, sortOrder])

  const rarityTiers = ['all', ...Array.from(new Set(nfts.map(nft => nft.rarity.tier)))]

  const getRarityColor = (tier: string) => {
    switch (tier) {
      case 'Founder': return 'text-purple-400 bg-purple-500/20'
      case 'Genesis': return 'text-yellow-400 bg-yellow-500/20'
      case 'Legendary': return 'text-red-400 bg-red-500/20'
      case 'Epic': return 'text-purple-400 bg-purple-500/20'
      case 'Rare': return 'text-blue-400 bg-blue-500/20'
      case 'Uncommon': return 'text-green-400 bg-green-500/20'
      case 'Common': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getCollectionStats = () => {
    const stats = {
      total: nfts.length,
      rarityDistribution: {} as Record<string, number>,
      averageBoost: 0,
      totalRewards: 0
    }

    nfts.forEach(nft => {
      stats.rarityDistribution[nft.rarity.tier] = (stats.rarityDistribution[nft.rarity.tier] || 0) + 1
      stats.averageBoost += nft.boostMultiplier
      stats.totalRewards += nft.estimatedRewards || 0
    })

    stats.averageBoost = stats.total > 0 ? stats.averageBoost / stats.total : 0

    return stats
  }

  const stats = getCollectionStats()

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NFT collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {stats.total} NFTs • Avg Boost: {stats.averageBoost.toFixed(1)}x
          </p>
        </div>

        {/* Collection Stats */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{stats.total}</div>
            <div className="text-xs text-gray-400">Total NFTs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.averageBoost.toFixed(1)}x</div>
            <div className="text-xs text-gray-400">Avg Boost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{Math.floor(stats.totalRewards / 1000)}K</div>
            <div className="text-xs text-gray-400">Tot Rewards</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="glass p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search NFTs, traits, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            {/* Rarity Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              >
                {rarityTiers.map(tier => (
                  <option key={tier} value={tier} className="bg-gray-800 text-white">
                    {tier === 'all' ? 'All Rarities' : tier}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="rarity" className="bg-gray-800">Rarity Score</option>
                <option value="sequence" className="bg-gray-800">Sequence</option>
                <option value="name" className="bg-gray-800">Name</option>
                <option value="boost" className="bg-gray-800">Boost</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(stats.rarityDistribution).map(([tier, count]) => (
            <div
              key={tier}
              className={`px-3 py-1 rounded-full text-xs font-medium ${getRarityColor(tier)}`}
            >
              {tier}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          {filteredNFTs.length} of {nfts.length} NFTs
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedRarity !== 'all' && ` in ${selectedRarity}`}
        </p>
      </div>

      {/* NFT Grid */}
      <AnimatePresence mode="wait">
        {filteredNFTs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
            <p className="text-gray-400">
              {searchTerm || selectedRarity !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No NFTs available in this collection'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${viewMode}-${filteredNFTs.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NFTCard
                  {...nft}
                  onClick={() => onNFTClick?.(nft)}
                  className={viewMode === 'list' ? 'flex flex-row' : ''}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NFTGallery