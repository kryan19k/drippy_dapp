import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Award, Zap, Eye, ExternalLink, TrendingUp } from 'lucide-react'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

interface NFTCardProps {
  tokenID: string
  metadata: NFTMetadata
  owner?: string
  rarity: {
    tier: string
    score: number
    sequence: number
  }
  boostMultiplier: number
  estimatedRewards?: number
  onClick?: () => void
  className?: string
}

const NFTCard: React.FC<NFTCardProps> = ({
  tokenID,
  metadata,
  owner,
  rarity,
  boostMultiplier,
  estimatedRewards = 0,
  onClick,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getRarityColor = (tier: string) => {
    switch (tier) {
      case 'Founder': return 'from-purple-600 to-pink-600'
      case 'Genesis': return 'from-yellow-500 to-orange-500'
      case 'Legendary': return 'from-red-500 to-pink-500'
      case 'Epic': return 'from-purple-500 to-blue-500'
      case 'Rare': return 'from-blue-500 to-cyan-500'
      case 'Uncommon': return 'from-green-500 to-blue-500'
      case 'Common':
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRarityIcon = (tier: string) => {
    switch (tier) {
      case 'Founder':
      case 'Genesis': return <Award className="w-4 h-4" />
      case 'Legendary': return <Star className="w-4 h-4" />
      case 'Epic':
      case 'Rare': return <Zap className="w-4 h-4" />
      default: return null
    }
  }

  const formatTokenId = (id: string) => {
    return `${id.slice(0, 6)}...${id.slice(-6)}`
  }

  const formatRewards = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`
    }
    return amount.toFixed(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-xl overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* NFT Image */}
      <div className="relative aspect-square overflow-hidden">
        {!imageError ? (
          <>
            <img
              src={metadata.image}
              alt={metadata.name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(true)
              }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Image not available</p>
            </div>
          </div>
        )}

        {/* Rarity Badge */}
        <div className="absolute top-3 left-3">
          <div className={`bg-gradient-to-r ${getRarityColor(rarity.tier)} px-3 py-1 rounded-full flex items-center space-x-1 text-white text-xs font-semibold shadow-lg`}>
            {getRarityIcon(rarity.tier)}
            <span>{rarity.tier}</span>
          </div>
        </div>

        {/* Boost Multiplier */}
        <div className="absolute top-3 right-3">
          <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 text-white text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>{boostMultiplier}x</span>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white text-center">
            <Eye className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">View Details</p>
          </div>
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-4">
        {/* Name and ID */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white mb-1 truncate">
            {metadata.name || 'Unnamed NFT'}
          </h3>
          <p className="text-gray-400 text-xs font-mono">
            #{rarity.sequence} • {formatTokenId(tokenID)}
          </p>
        </div>

        {/* Description */}
        {metadata.description && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {metadata.description}
          </p>
        )}

        {/* Attributes Preview */}
        {metadata.attributes && metadata.attributes.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {metadata.attributes.slice(0, 2).map((attr, index) => (
                <div
                  key={index}
                  className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300"
                >
                  <span className="text-gray-400">{attr.trait_type}:</span> {attr.value}
                </div>
              ))}
              {metadata.attributes.length > 2 && (
                <div className="bg-white/10 px-2 py-1 rounded text-xs text-gray-400">
                  +{metadata.attributes.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <p className="text-gray-400 text-xs">Rarity Score</p>
            <p className="text-white font-semibold">{rarity.score}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Est. Rewards</p>
            <p className="text-primary-400 font-semibold">{formatRewards(estimatedRewards)}</p>
          </div>
        </div>

        {/* Owner */}
        {owner && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-gray-400 text-xs mb-1">Owner</p>
            <p className="text-gray-300 text-sm font-mono">
              {owner.length > 20 ? `${owner.slice(0, 8)}...${owner.slice(-8)}` : owner}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Open XRPL explorer
              window.open(`https://xrplorer.com/nft/${tokenID}`, '_blank')
            }}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Explorer</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default NFTCard