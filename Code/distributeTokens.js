const { Client, Wallet } = require('xrpl');

async function distributeTokens() {
  const client = new Client('wss://s1.ripple.com');
  await client.connect();
  const issuerWallet = Wallet.fromSeed('issuer_seed'); // Issuer signer (replace)
  const distributions = [
    { destination: 'operational_r_address', amount: '58900000' }, // LP
    { destination: 'rJVUU12qUKFGccukM9Cmr6dZewyUshZY8K', amount: '15903000' }, // Team lock
    { destination: 'rGuAGX7XTJA8N84ChScxrpQW9CT37VQkoZ', amount: '29450000' }, // Treasury #2
    { destination: 'rGNZ4eXcwqCjcqAR9RWX5vcDJ8wH1upLZB', amount: '484747000' }, // Escrow
  ];
  for (const dist of distributions) {
    const tx = {
      TransactionType: 'Payment',
      Account: 'issuer_r_address',
      Destination: dist.destination,
      Amount: {
        currency: 'DRIPPY',
        value: dist.amount,
        issuer: 'issuer_r_address',
      },
    };
    const result = await client.submit(tx, { wallet: issuerWallet, autofill: true });
    console.log('Distributed to', dist.destination, ':', result);
  }
  await client.disconnect();
}
