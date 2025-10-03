import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, Star, Clock, TrendingUp } from 'lucide-react'
import NFTGallery from '../components/nft/NFTGallery'

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
  estimatedRewards?: number
}

interface CollectionStats {
  totalSupply: number
  rarityDistribution: Record<string, number>
  averageBoost: number
  topNFTs: NFT[]
  lastUpdated: string
}

const NFTPage: React.FC = () => {
  const navigate = useNavigate()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use main server API endpoint
  const API_BASE = 'http://localhost:8787/api/nft'

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true)

        // Fetch collection stats
        const statsResponse = await fetch(`${API_BASE}/collection/stats`)
        if (!statsResponse.ok) throw new Error('Failed to fetch collection stats')
        const collectionStats = await statsResponse.json()
        setStats(collectionStats)

        // Fetch all NFTs with pagination (get more initially to show the 589 NFTs)
        const nftResponse = await fetch(`${API_BASE}/collection/all?limit=589`)
        if (!nftResponse.ok) throw new Error('Failed to fetch NFTs')
        const nftData = await nftResponse.json()

        // Process NFTs to add estimated rewards
        const processedNFTs = nftData.nfts.map((nft: NFT) => ({
          ...nft,
          estimatedRewards: Math.floor(nft.boostMultiplier * 1000 + Math.random() * 500)
        }))

        setNfts(processedNFTs)
      } catch (err) {
        console.error('Error fetching NFT data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load NFT data')
      } finally {
        setLoading(false)
      }
    }

    fetchNFTData()
  }, [])


  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">NFT Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Discover and trade Drippy NFTs with unique reward rates.
          </p>
        </div>
        <div className="glass p-8 rounded-xl text-center">
          <p className="text-red-400 mb-4">Failed to load NFT data: {error}</p>
          <p className="text-gray-400 text-sm">
            Make sure the backend server is running on port 8788
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">DRIPPY NFT Collection</h1>
        <p className="text-muted-foreground mt-1">
          Discover real NFTs from XRPL mainnet with unique reward multipliers.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-6 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total NFTs</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.totalSupply}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Avg Boost</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.averageBoost.toFixed(1)}x</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-6 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Star className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Top Rarity</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {stats.topNFTs[0]?.rarity.tier || 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-elevated p-6 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Issuer</p>
                <p className="text-sm font-bold text-card-foreground">rwprJf1ZEU3f...</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* NFT Gallery */}
      <NFTGallery
        nfts={nfts}
        loading={loading}
        title="XRPL Mainnet Collection"
        onNFTClick={(nft) => {
          navigate(`/nft/${nft.tokenID}`)
        }}
      />
    </div>
  )
}

export default NFTPage
