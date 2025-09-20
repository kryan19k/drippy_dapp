const { Client, Wallet } = require('xrpl');

async function relockUnused() {
  const client = new Client('wss://s1.ripple.com');
  await client.connect();
  const wallet = Wallet.fromSeed('team_signer_seed');
  const tx = {
    TransactionType: 'EscrowCreate',
    Account: 'rJVUU12qUKFGccukM9Cmr6dZewyUshZY8K',
    Destination: 'rGNZ4eXcwqCjcqAR9RWX5vcDJ8wH1upLZB',
    Amount: '50000.000000',
    FinishAfter: Math.floor(Date.now() / 1000) + 31536000, // 1-year lock
  };
  const result = await client.submit(tx, { wallet, autofill: true });
  console.log('Relocked:', result);
  await client.disconnect();
}
