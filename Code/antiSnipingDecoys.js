const { Client, Wallet } = require('xrpl');

async function antiSnipingDecoys() {
  const client = new Client('wss://s1.ripple.com');
  await client.connect();
  const wallet = Wallet.fromSeed('deployer_seed');
  for (let i = 0; i < 5; i++) {
    const decoy = {
      TransactionType: 'AMMDeposit',
      Account: 'rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ',
      Asset: { currency: 'DRIPPY', issuer: 'issuer_r_address' },
      Amount: '100.000000',
      Asset2: { currency: 'XRP' },
      Amount2: '1000000', // 1 XRP
    };
    await client.submit(decoy, { wallet, autofill: true });
  }
  await client.disconnect();
}
