// Encode ASCII to hex (e.g., currency code)
const s = process.argv.slice(2).join(' ')
if (!s) {
  console.error('Usage: node hooks/util/encodeAscii.js DRIPPY')
  process.exit(1)
}
const hex = Buffer.from(s, 'utf8').toString('hex').toUpperCase()
console.log(hex)

