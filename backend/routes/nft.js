const express = require('express')
const router = express.Router()
const NFTService = require('../src/nft-service')

const nftService = new NFTService()

// Get collection statistics
router.get('/collection/stats', async (req, res) => {
  try {
    console.log('📊 Fetching NFT collection statistics...')
    const stats = await nftService.getCollectionStats()
    res.json(stats)
  } catch (error) {
    console.error('Error getting collection stats:', error)
    res.status(500).json({ error: 'Failed to get collection statistics' })
  }
})

// Get all NFTs from the issuer (Taxon 2)
router.get('/collection/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100 // Increased default limit
    const offset = parseInt(req.query.offset) || 0

    console.log('🔍 Fetching all NFTs from collection (Taxon 2)...')
    const allNFTs = await nftService.getNFTsByIssuer(nftService.issuerAccount, nftService.targetTaxon)

    // Apply pagination
    const paginatedNFTs = allNFTs.slice(offset, offset + limit)

    res.json({
      nfts: paginatedNFTs,
      total: allNFTs.length,
      limit,
      offset,
      hasMore: offset + limit < allNFTs.length,
      taxon: nftService.targetTaxon
    })
  } catch (error) {
    console.error('Error getting collection NFTs:', error)
    res.status(500).json({ error: 'Failed to get collection NFTs' })
  }
})

// Get NFTs owned by a specific account
router.get('/user/:account', async (req, res) => {
  try {
    const { account } = req.params

    if (!account || !account.startsWith('r')) {
      return res.status(400).json({ error: 'Invalid account address' })
    }

    console.log(`🔍 Fetching NFTs for user: ${account}`)
    const userNFTs = await nftService.getNFTsByOwner(account)

    // Calculate estimated rewards
    const estimatedRewards = nftService.calculateNFTRewards(userNFTs)

    res.json({
      account,
      nfts: userNFTs,
      count: userNFTs.length,
      totalBoost: userNFTs.reduce((sum, nft) => sum + nft.boostMultiplier, 0),
      estimatedRewards,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error(`Error getting user NFTs for ${req.params.account}:`, error)
    res.status(500).json({ error: 'Failed to get user NFTs' })
  }
})

// Get specific NFT details
router.get('/token/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params

    console.log(`🔍 Fetching details for NFT: ${tokenId}`)
    const nftDetails = await nftService.getNFTDetails(tokenId)

    if (!nftDetails) {
      return res.status(404).json({ error: 'NFT not found' })
    }

    res.json(nftDetails)
  } catch (error) {
    console.error(`Error getting NFT details for ${req.params.tokenId}:`, error)
    res.status(500).json({ error: 'Failed to get NFT details' })
  }
})

// Get NFTs by rarity tier
router.get('/collection/rarity/:tier', async (req, res) => {
  try {
    const { tier } = req.params
    const validTiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Genesis', 'Founder']

    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid rarity tier',
        validTiers
      })
    }

    console.log(`🔍 Fetching ${tier} NFTs...`)
    const allNFTs = await nftService.getNFTsByIssuer()
    const filteredNFTs = allNFTs.filter(nft => nft.rarity.tier === tier)

    res.json({
      tier,
      nfts: filteredNFTs,
      count: filteredNFTs.length
    })
  } catch (error) {
    console.error(`Error getting ${req.params.tier} NFTs:`, error)
    res.status(500).json({ error: 'Failed to get NFTs by rarity' })
  }
})

// Get top NFTs by rarity score
router.get('/collection/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    console.log(`🏆 Fetching top ${limit} NFTs by rarity...`)
    const allNFTs = await nftService.getNFTsByIssuer()
    const topNFTs = allNFTs
      .sort((a, b) => b.rarity.score - a.rarity.score)
      .slice(0, limit)

    res.json({
      topNFTs,
      count: topNFTs.length
    })
  } catch (error) {
    console.error('Error getting top NFTs:', error)
    res.status(500).json({ error: 'Failed to get top NFTs' })
  }
})

// Search NFTs by name or attributes
router.get('/search', async (req, res) => {
  try {
    const { q, attribute, value } = req.query

    if (!q && !attribute) {
      return res.status(400).json({ error: 'Search query or attribute filter required' })
    }

    console.log(`🔍 Searching NFTs with query: ${q || `${attribute}=${value}`}`)
    const allNFTs = await nftService.getNFTsByIssuer()

    let filteredNFTs = allNFTs

    // Text search
    if (q) {
      const query = q.toLowerCase()
      filteredNFTs = filteredNFTs.filter(nft =>
        (nft.metadata?.name && nft.metadata.name.toLowerCase().includes(query)) ||
        (nft.metadata?.description && nft.metadata.description.toLowerCase().includes(query)) ||
        nft.tokenID.toLowerCase().includes(query)
      )
    }

    // Attribute filter
    if (attribute && value) {
      filteredNFTs = filteredNFTs.filter(nft =>
        nft.metadata?.attributes?.some(attr =>
          attr.trait_type === attribute &&
          attr.value.toString().toLowerCase() === value.toLowerCase()
        )
      )
    }

    res.json({
      query: q,
      attribute,
      value,
      nfts: filteredNFTs,
      count: filteredNFTs.length
    })
  } catch (error) {
    console.error('Error searching NFTs:', error)
    res.status(500).json({ error: 'Failed to search NFTs' })
  }
})

// Get reward calculation for specific NFTs
router.post('/rewards/calculate', async (req, res) => {
  try {
    const { tokenIds, totalRewardPool } = req.body

    if (!tokenIds || !Array.isArray(tokenIds)) {
      return res.status(400).json({ error: 'Token IDs array required' })
    }

    console.log(`💰 Calculating rewards for ${tokenIds.length} NFTs...`)

    // Fetch NFT details
    const nftDetails = await Promise.all(
      tokenIds.map(id => nftService.getNFTDetails(id))
    )

    const validNFTs = nftDetails.filter(nft => nft !== null)
    const estimatedRewards = nftService.calculateNFTRewards(validNFTs, totalRewardPool)

    res.json({
      tokenIds,
      nftCount: validNFTs.length,
      totalBoost: validNFTs.reduce((sum, nft) => sum + nft.boostMultiplier, 0),
      estimatedRewards,
      rewardPool: totalRewardPool || 1000000,
      nftDetails: validNFTs
    })
  } catch (error) {
    console.error('Error calculating NFT rewards:', error)
    res.status(500).json({ error: 'Failed to calculate NFT rewards' })
  }
})

// Get issuer information
router.get('/issuer/info', async (req, res) => {
  try {
    const issuerAccount = nftService.issuerAccount

    res.json({
      issuer: issuerAccount,
      name: 'DRIPPY NFT Collection',
      description: 'Official DRIPPY DeFi NFT Collection with reward boosts',
      website: 'https://drippy.defi',
      endpoints: {
        collection: '/api/nft/collection/all',
        stats: '/api/nft/collection/stats',
        userNFTs: '/api/nft/user/:account',
        tokenDetails: '/api/nft/token/:tokenId'
      }
    })
  } catch (error) {
    console.error('Error getting issuer info:', error)
    res.status(500).json({ error: 'Failed to get issuer information' })
  }
})

// Clear cache endpoint for debugging
router.post('/cache/clear', async (req, res) => {
  try {
    nftService.clearCache()
    res.json({ message: 'NFT cache cleared successfully' })
  } catch (error) {
    console.error('Error clearing cache:', error)
    res.status(500).json({ error: 'Failed to clear cache' })
  }
})

// Cleanup on module unload
process.on('exit', async () => {
  await nftService.disconnect()
})

module.exports = router