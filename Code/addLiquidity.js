const { Client, Wallet } = require('xrpl');

async function addLiquidity() {
  const client = new Client('wss://s1.ripple.com');
  await client.connect();
  const wallet = Wallet.fromSeed('deployer_seed'); // Replace
  const tx = {
    TransactionType: 'AMMDeposit',
    Account: 'rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ',
    Asset: { currency: 'DRIPPY', issuer: 'issuer_r_address' },
    Amount: '58900000.000000',
    Asset2: { currency: 'XRP' },
    Amount2: '10000000000', // $10K XRP
  };
  const result = await client.submit(tx, { wallet, autofill: true });
  console.log('Liquidity Added:', result);

  // Burn 5k LP tokens
  const burnTx = {
    TransactionType: 'Payment',
    Account: 'rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ',
    Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    Amount: { currency: 'LPTOKEN', value: '5000', issuer: 'rae3QB8qYkseWuNmkmHGXQJHFybSQ3115J' },
  };
  await client.submit(burnTx, { wallet, autofill: true });
  await client.disconnect();
}
