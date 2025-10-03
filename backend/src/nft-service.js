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
    this.targetTaxon = 2 // The 589 NFTs are in Taxon 2
    this.mainnetWSS = process.env.XRPL_MAINNET_WSS || 'wss://xrplcluster.com'
    this.bithompApiKey = process.env.BITHOMP_API_KEY
    this.bithompBaseUrl = 'https://bithomp.com/api/v2'
  }

  clearCache() {
    this.cache.clear()
    console.log('🗑️ NFT cache cleared')
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
   * Get all NFTs issued by the specified account using Bithomp API
   */
  async getNFTsByIssuer(issuer = this.issuerAccount, taxon = this.targetTaxon) {
    try {
      console.log(`🔍 Fetching all NFTs from issuer: ${issuer} via Bithomp API`)

      if (!this.bithompApiKey) {
        throw new Error('Bithomp API key not configured')
      }

      let allNFTs = []
      let marker = null
      let totalFetched = 0

      // Use pagination to get all NFTs from this issuer
      do {
        const url = `${this.bithompBaseUrl}/nfts?issuer=${issuer}&limit=100${marker ? `&marker=${marker}` : ''}`
        console.log(`🌐 Fetching from: ${url}`)

        const response = await axios.get(url, {
          headers: {
            'x-bithomp-token': this.bithompApiKey,
            'User-Agent': 'DRIPPY-NFT-Service/1.0'
          },
          timeout: 30000
        }).catch(async (error) => {
          if (error.response?.status === 429) {
            const retryAfter = error.response.data?.error?.match(/retry in (\d+)s/)?.[1] || 5
            console.log(`⏳ Rate limited, waiting ${retryAfter} seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000 + 1000)) // Add 1s buffer
            return axios.get(url, {
              headers: {
                'x-bithomp-token': this.bithompApiKey,
                'User-Agent': 'DRIPPY-NFT-Service/1.0'
              },
              timeout: 30000
            })
          }
          throw error
        })

        const data = response.data
        const nfts = data.nfts || []

        // Filter by taxon if specified
        const filteredNFTs = taxon !== null ?
          nfts.filter(nft => nft.nftokenTaxon === taxon) :
          nfts

        allNFTs.push(...filteredNFTs)
        totalFetched += nfts.length
        marker = data.marker

        console.log(`📦 Fetched ${nfts.length} NFTs (${filteredNFTs.length} matching taxon ${taxon}), total found: ${allNFTs.length}`)

        // Add small delay between requests
        if (marker) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } while (marker && totalFetched < 1000) // Safety limit

      console.log(`✅ Total NFTs found: ${allNFTs.length}`)

      // Process each NFT to match our expected format
      const processedNFTs = []
      const batchSize = 20

      for (let i = 0; i < allNFTs.length; i += batchSize) {
        const batch = allNFTs.slice(i, i + batchSize)
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allNFTs.length/batchSize)} (${batch.length} NFTs)`)

        const batchResults = await Promise.all(
          batch.map(nft => this.processBithompNFT(nft))
        )

        processedNFTs.push(...batchResults.filter(nft => nft !== null))

        // Add small delay between batches
        if (i + batchSize < allNFTs.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      console.log(`✅ Successfully processed ${processedNFTs.length} NFTs`)
      return processedNFTs

    } catch (error) {
      console.error('❌ Error fetching NFTs from Bithomp:', error)
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
   * Process Bithomp NFT data to match our expected format
   */
  async processBithompNFT(bithompNFT) {
    try {
      const tokenID = bithompNFT.nftokenID
      const cached = this.cache.get(tokenID)

      if (cached) {
        return cached
      }

      // Extract metadata from Bithomp format
      let metadata = {
        name: bithompNFT.metadata?.name || `Drippy #${bithompNFT.nftSerial || 'Unknown'}`,
        description: bithompNFT.metadata?.description || 'DRIPPY NFT from XRPL',
        image: bithompNFT.metadata?.image || null,
        attributes: bithompNFT.metadata?.attributes || []
      }

      // Convert IPFS image URL to HTTP gateway format
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        const imagePath = metadata.image.replace('ipfs://', '')
        const imagePathParts = imagePath.split('/')
        const encodedImageParts = imagePathParts.map(part => encodeURIComponent(part))
        metadata.image = `https://ipfs.io/ipfs/${encodedImageParts.join('/')}`
        console.log(`🖼️ Converted IPFS image URL: ${metadata.image}`)
      }

      // Calculate rarity and boost multiplier using our existing logic
      const nftForRarity = {
        nft_serial: bithompNFT.nftSerial || 0,
        NFTokenID: tokenID
      }
      const rarity = this.calculateRarity(nftForRarity, metadata)
      const boostMultiplier = this.calculateBoostMultiplier(rarity)

      const processedNFT = {
        tokenID,
        issuer: bithompNFT.issuer || this.issuerAccount,
        owner: bithompNFT.owner || 'Unknown',
        uri: bithompNFT.uri || null,
        metadata,
        rarity,
        boostMultiplier,
        flags: bithompNFT.flags || {},
        transferFee: bithompNFT.transferFee || 0,
        sequence: bithompNFT.nftSerial || 0,
        lastProcessed: new Date().toISOString()
      }

      // Cache the processed NFT
      this.cache.set(tokenID, processedNFT)

      return processedNFT
    } catch (error) {
      console.error(`❌ Error processing Bithomp NFT ${bithompNFT.nftokenID}:`, error)
      return null
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
        // Replace ipfs:// with https://ipfs.io/ipfs/ and properly encode the path
        const ipfsPath = decodedURI.replace('ipfs://', '')
        // Split on / and encode each part separately to preserve directory structure
        const pathParts = ipfsPath.split('/')
        const encodedParts = pathParts.map(part => encodeURIComponent(part))
        fetchURL = `https://ipfs.io/ipfs/${encodedParts.join('/')}`
      }

      console.log(`🔗 Encoded fetch URL: ${fetchURL}`)

      const response = await axios.get(fetchURL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'DRIPPY-NFT-Service/1.0'
        }
      })

      const metadata = response.data
      console.log(`✅ Fetched metadata for: ${metadata.name || 'Unnamed NFT'}`)

      // Process image URLs to convert IPFS to HTTP
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        const imagePath = metadata.image.replace('ipfs://', '')
        const imagePathParts = imagePath.split('/')
        const encodedImageParts = imagePathParts.map(part => encodeURIComponent(part))
        metadata.image = `https://ipfs.io/ipfs/${encodedImageParts.join('/')}`
        console.log(`🖼️ Converted image URL: ${metadata.image}`)
      }

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
    const nfts = await this.getNFTsByIssuer(this.issuerAccount, this.targetTaxon)

    const stats = {
      totalSupply: nfts.length,
      rarityDistribution: {},
      averageBoost: 0,
      topNFTs: [],
      taxon: this.targetTaxon,
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
    try {
      console.log(`🔍 Looking up NFT details for: ${tokenID}`)

      // First check if it's in cache
      const cached = this.cache.get(tokenID)
      if (cached) {
        console.log(`✅ Found NFT in cache: ${cached.metadata?.name || 'Unknown'}`)
        return cached
      }

      // If not in cache, fetch all NFTs and look for this specific one
      console.log(`🔄 NFT not in cache, fetching collection data...`)
      const allNFTs = await this.getNFTsByIssuer(this.issuerAccount, this.targetTaxon)

      // Find the specific NFT by tokenID
      const foundNFT = allNFTs.find(nft => nft.tokenID === tokenID)

      if (foundNFT) {
        console.log(`✅ Found NFT in collection: ${foundNFT.metadata?.name || 'Unknown'}`)
        return foundNFT
      }

      console.log(`❌ NFT ${tokenID} not found in collection`)
      return null
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