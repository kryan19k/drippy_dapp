// Encode classic r-address to 20-byte hex for Hook Parameters
const xrpl = require('xrpl')

const addr = process.argv[2]
if (!addr) {
  console.error('Usage: node hooks/util/encodeAddress.js rADDRESS')
  process.exit(1)
}

try {
  const decoded = xrpl.decodeAccountID(addr) // returns Buffer
  console.log(Buffer.from(decoded).toString('hex').toUpperCase())
} catch (e) {
  console.error('Invalid address:', e.message)
  process.exit(2)
}

