import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Copy, Star, TrendingUp, Clock, User, Hash, Palette, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

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
  rarity: {
    tier: string
    score: number
    sequence: number
  }
  boostMultiplier: number
  owner: string
  issuer: string
  transferFee: number
  flags: any
  lastProcessed: string
  estimatedRewards?: number
}

const NFTDetail: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>()
  const navigate = useNavigate()
  const [nft, setNft] = useState<NFT | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const API_BASE = 'http://localhost:8787/api/nft'

  useEffect(() => {
    const fetchNFTDetail = async () => {
      if (!tokenId) return

      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/token/${tokenId}`)

        if (!response.ok) {
          throw new Error(`NFT not found (${response.status})`)
        }

        const nftData = await response.json()
        setNft({
          ...nftData,
          estimatedRewards: Math.floor(nftData.boostMultiplier * 1000 + Math.random() * 500)
        })
      } catch (err) {
        console.error('Error fetching NFT details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load NFT details')
      } finally {
        setLoading(false)
      }
    }

    fetchNFTDetail()
  }, [tokenId])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Founder': return 'text-red-400 bg-red-400/20 border-red-400/30'
      case 'Genesis': return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
      case 'Legendary': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
      case 'Epic': return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
      case 'Rare': return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
      case 'Uncommon': return 'text-green-400 bg-green-400/20 border-green-400/30'
      case 'Common':
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  const openInXRPLExplorer = (tokenID: string) => {
    window.open(`https://mainnet.xrpl.org/nftoken/${tokenID}`, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
          <div className="w-48 h-8 bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-700 rounded-xl"></div>
          <div className="space-y-6">
            <div className="w-3/4 h-8 bg-gray-700 rounded"></div>
            <div className="w-full h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !nft) {
    return (
      <div className="space-y-8">
        <button
          onClick={() => navigate('/nft')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Gallery</span>
        </button>
        <div className="glass p-8 rounded-xl text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">NFT Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={() => navigate('/nft')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Gallery</span>
        </button>

        <button
          onClick={() => openInXRPLExplorer(nft.tokenID)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on XRPL</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden group">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!imageError ? (
              <img
                src={nft.metadata.image}
                alt={nft.metadata.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Image not available</p>
                </div>
              </div>
            )}

            {/* Overlay with rarity badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRarityColor(nft.rarity.tier)}`}>
                {nft.rarity.tier}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Details Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Title and Description */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{nft.metadata.name}</h1>
            <p className="text-muted-foreground text-lg">{nft.metadata.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-elevated p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-muted-foreground">Rarity Score</span>
              </div>
              <p className="text-xl font-bold text-card-foreground">{nft.rarity.score}</p>
            </div>

            <div className="card-elevated p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Boost Multiplier</span>
              </div>
              <p className="text-xl font-bold text-card-foreground">{nft.boostMultiplier}x</p>
            </div>

            <div className="card-elevated p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Hash className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Sequence</span>
              </div>
              <p className="text-xl font-bold text-card-foreground">#{nft.rarity.sequence}</p>
            </div>

            <div className="card-elevated p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Est. Rewards</span>
              </div>
              <p className="text-xl font-bold text-card-foreground">{nft.estimatedRewards?.toLocaleString()}</p>
            </div>
          </div>

          {/* Token Information */}
          <div className="card-elevated p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Token Information</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token ID</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-card-foreground">{formatAddress(nft.tokenID)}</span>
                  <button
                    onClick={() => copyToClipboard(nft.tokenID, 'Token ID')}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Owner</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-card-foreground">{formatAddress(nft.owner)}</span>
                  <button
                    onClick={() => copyToClipboard(nft.owner, 'Owner address')}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Issuer</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-card-foreground">{formatAddress(nft.issuer)}</span>
                  <button
                    onClick={() => copyToClipboard(nft.issuer, 'Issuer address')}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {nft.transferFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transfer Fee</span>
                  <span className="text-card-foreground">{nft.transferFee / 1000}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Attributes */}
          {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
            <div className="card-elevated p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Attributes</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nft.metadata.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {attr.trait_type}
                    </div>
                    <div className="text-sm font-medium text-card-foreground mt-1">
                      {attr.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default NFTDetail