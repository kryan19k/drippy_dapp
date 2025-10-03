require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nftRoutes = require('./routes/nft')

const app = express()
app.use(express.json())
app.use(cors())

// Mount NFT routes
app.use('/api/nft', nftRoutes)

app.get('/test', (req, res) => {
  res.json({ message: 'Test server working' })
})

const port = 8788
app.listen(port, () => {
  console.log(`Test server listening on http://localhost:${port}`)
  console.log('NFT routes mounted at /api/nft')
})