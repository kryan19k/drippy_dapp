#!/usr/bin/env node

/**
 * DRIPPY NFT Service
 *
 * Fetches and manages NFT data from XRPL mainnet
 * Handles metadata fetching, caching, and reward calculations
 */

require('dotenv').config()
const xrpl = require('xrpl')
const axios = require('axios')

class NFTService {
  constructor() {
    this.client = null
    this.cache = new Map()
    this.issuerAccount = 'rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ'
    this.mainnetWSS = process.env.XRPL_MAINNET_WSS || 'wss://xrplcluster.com'
  }

  async connect() {
    if (!this.client) {
      this.client = new xrpl.Client(this.mainnetWSS, {
        connectionTimeout: 10000
      })
      await this.client.connect()
      console.log('✅ Connected to XRPL mainnet for NFT data')
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect()
      this.client = null
    }
  }

  /**
   * Get all NFTs issued by the specified account
   */
  async getNFTsByIssuer(issuer = this.issuerAccount) {
    await this.connect()

    try {
      console.log(`🔍 Fetching NFTs from issuer: ${issuer}`)

      // Get all NFT tokens issued by this account
      const response = await this.client.request({
        command: 'account_nfts',
        account: issuer,
        ledger_index: 'validated'
      })

      const nfts = response.result.account_nfts || []
      console.log(`📦 Found ${nfts.length} NFTs from issuer`)

      // Process each NFT to get metadata
      const processedNFTs = await Promise.all(
        nfts.map(nft => this.processNFT(nft))
      )

      return processedNFTs.filter(nft => nft !== null)
    } catch (error) {
      console.error('❌ Error fetching NFTs:', error)
      return []
    }
  }

  /**
   * Get NFTs owned by a specific account
   */
  async getNFTsByOwner(ownerAccount) {
    await this.connect()

    try {
      console.log(`🔍 Fetching NFTs owned by: ${ownerAccount}`)

      const response = await this.client.request({
        command: 'account_nfts',
        account: ownerAccount,
        ledger_index: 'validated'
      })

      const nfts = response.result.account_nfts || []

      // Filter only NFTs from our issuer
      const drippyNFTs = nfts.filter(nft =>
        nft.Issuer === this.issuerAccount
      )

      console.log(`📦 Found ${drippyNFTs.length} DRIPPY NFTs owned by ${ownerAccount}`)

      // Process each NFT to get metadata
      const processedNFTs = await Promise.all(
        drippyNFTs.map(nft => this.processNFT(nft, ownerAccount))
      )

      return processedNFTs.filter(nft => nft !== null)
    } catch (error) {
      console.error('❌ Error fetching user NFTs:', error)
      return []
    }
  }

  /**
   * Process individual NFT to extract metadata and calculate rewards
   */
  async processNFT(nft, owner = null) {
    try {
      const tokenID = nft.NFTokenID
      const cached = this.cache.get(tokenID)

      if (cached) {
        return { ...cached, owner }
      }

      console.log(`🔄 Processing NFT: ${tokenID}`)

      // Decode URI if present
      let metadata = null
      if (nft.URI) {
        metadata = await this.fetchMetadata(nft.URI)
      }

      // Calculate rarity and boost multiplier
      const rarity = this.calculateRarity(nft, metadata)
      const boostMultiplier = this.calculateBoostMultiplier(rarity)

      const processedNFT = {
        tokenID,
        issuer: nft.Issuer,
        owner: owner || nft.Owner || 'Unknown',
        uri: nft.URI,
        metadata,
        rarity,
        boostMultiplier,
        flags: nft.Flags,
        transferFee: nft.TransferFee || 0,
        sequence: nft.nft_serial || 0,
        lastProcessed: new Date().toISOString()
      }

      // Cache the processed NFT
      this.cache.set(tokenID, processedNFT)

      return processedNFT
    } catch (error) {
      console.error(`❌ Error processing NFT ${nft.NFTokenID}:`, error)
      return null
    }
  }

  /**
   * Fetch metadata from IPFS or HTTP URI
   */
  async fetchMetadata(uri) {
    try {
      // Convert hex URI to string
      const decodedURI = Buffer.from(uri, 'hex').toString('utf8')
      console.log(`🌐 Fetching metadata from: ${decodedURI}`)

      // Handle IPFS URIs
      let fetchURL = decodedURI
      if (decodedURI.startsWith('ipfs://')) {
        fetchURL = decodedURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      }

      const response = await axios.get(fetchURL, {
        timeout: 5000,
        headers: {
          'User-Agent': 'DRIPPY-NFT-Service/1.0'
        }
      })

      const metadata = response.data
      console.log(`✅ Fetched metadata for: ${metadata.name || 'Unnamed NFT'}`)

      return metadata
    } catch (error) {
      console.error(`❌ Error fetching metadata from ${uri}:`, error)
      return {
        name: 'Unknown NFT',
        description: 'Metadata could not be loaded',
        image: null,
        error: error.message
      }
    }
  }

  /**
   * Calculate NFT rarity based on attributes and sequence
   */
  calculateRarity(nft, metadata) {
    let rarityScore = 0
    let rarityTier = 'Common'

    // Sequence-based rarity (lower sequence = higher rarity)
    const sequence = nft.nft_serial || 0
    if (sequence <= 10) {
      rarityScore += 100
      rarityTier = 'Legendary'
    } else if (sequence <= 100) {
      rarityScore += 50
      rarityTier = 'Epic'
    } else if (sequence <= 500) {
      rarityScore += 25
      rarityTier = 'Rare'
    } else if (sequence <= 1000) {
      rarityScore += 10
      rarityTier = 'Uncommon'
    }

    // Metadata-based rarity
    if (metadata && metadata.attributes) {
      const rareAttributes = metadata.attributes.filter(attr =>
        attr.trait_type && attr.value &&
        (attr.value.toString().toLowerCase().includes('rare') ||
         attr.value.toString().toLowerCase().includes('legendary') ||
         attr.value.toString().toLowerCase().includes('epic'))
      )
      rarityScore += rareAttributes.length * 20
    }

    // Special traits
    if (metadata && metadata.name) {
      if (metadata.name.toLowerCase().includes('founder')) {
        rarityScore += 200
        rarityTier = 'Founder'
      } else if (metadata.name.toLowerCase().includes('genesis')) {
        rarityScore += 150
        rarityTier = 'Genesis'
      }
    }

    return {
      score: rarityScore,
      tier: rarityTier,
      sequence
    }
  }

  /**
   * Calculate boost multiplier based on rarity
   */
  calculateBoostMultiplier(rarity) {
    switch (rarity.tier) {
      case 'Founder': return 5.0
      case 'Genesis': return 4.0
      case 'Legendary': return 3.0
      case 'Epic': return 2.5
      case 'Rare': return 2.0
      case 'Uncommon': return 1.5
      case 'Common':
      default: return 1.0
    }
  }

  /**
   * Get NFT collection statistics
   */
  async getCollectionStats() {
    const nfts = await this.getNFTsByIssuer()

    const stats = {
      totalSupply: nfts.length,
      rarityDistribution: {},
      averageBoost: 0,
      topNFTs: [],
      lastUpdated: new Date().toISOString()
    }

    // Calculate rarity distribution
    nfts.forEach(nft => {
      const tier = nft.rarity.tier
      stats.rarityDistribution[tier] = (stats.rarityDistribution[tier] || 0) + 1
    })

    // Calculate average boost
    const totalBoost = nfts.reduce((sum, nft) => sum + nft.boostMultiplier, 0)
    stats.averageBoost = nfts.length > 0 ? totalBoost / nfts.length : 1.0

    // Get top NFTs by rarity score
    stats.topNFTs = nfts
      .sort((a, b) => b.rarity.score - a.rarity.score)
      .slice(0, 10)
      .map(nft => ({
        tokenID: nft.tokenID,
        name: nft.metadata?.name || 'Unknown',
        rarity: nft.rarity,
        boostMultiplier: nft.boostMultiplier
      }))

    return stats
  }

  /**
   * Calculate estimated rewards for NFT holder
   */
  calculateNFTRewards(userNFTs, totalRewardPool = 1000000) {
    if (!userNFTs || userNFTs.length === 0) return 0

    // Get total boost from user's NFTs
    const userBoost = userNFTs.reduce((total, nft) => total + nft.boostMultiplier, 0)

    // Simple reward calculation (can be enhanced)
    const baseReward = totalRewardPool * 0.4 // 40% to NFT holders
    const userShare = userBoost / 100 // Simplified calculation

    return Math.floor(userShare * baseReward)
  }

  /**
   * Get detailed NFT information by Token ID
   */
  async getNFTDetails(tokenID) {
    await this.connect()

    try {
      const response = await this.client.request({
        command: 'nft_info',
        nft_id: tokenID,
        ledger_index: 'validated'
      })

      const nft = response.result
      return await this.processNFT(nft)
    } catch (error) {
      console.error(`❌ Error fetching NFT details for ${tokenID}:`, error)
      return null
    }
  }
}

// CLI usage
if (require.main === module) {
  const nftService = new NFTService()

  const main = async () => {
    try {
      console.log('🚀 Starting NFT Service...')

      // Get collection stats
      console.log('\n📊 Fetching collection statistics...')
      const stats = await nftService.getCollectionStats()
      console.log('Collection Stats:', JSON.stringify(stats, null, 2))

      // Example: Get NFTs for a specific owner
      // const userNFTs = await nftService.getNFTsByOwner('rUserAccountAddress')
      // console.log('User NFTs:', userNFTs.length)

    } catch (error) {
      console.error('❌ NFT Service error:', error)
    } finally {
      await nftService.disconnect()
      process.exit(0)
    }
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down NFT Service...')
    await nftService.disconnect()
    process.exit(0)
  })

  main()
}

module.exports = NFTService