const { Client, Wallet } = require('xrpl');

async function setupEscrow() {
  const client = new Client('wss://s1.ripple.com');
  await client.connect();
  const issuerWallet = Wallet.fromSeed('issuer_seed');
  const nonCirculating = '484747000.000000';
  const escrowTx = {
    TransactionType: 'EscrowCreate',
    Account: 'issuer_r_address',
    Destination: 'rGNZ4eXcwqCjcqAR9RWX5vcDJ8wH1upLZB',
    Amount: nonCirculating,
    FinishAfter: Math.floor(Date.now() / 1000) + 31536000, // 1-year lock
  };
  await client.submit(escrowTx, { wallet: issuerWallet, autofill: true });

  // Monthly releases (12 months example)
  for (let month = 1; month <= 12; month++) {
    const monthly = '1767000.000000'; // 2% of 88.35M
    const monthlyTx = {
      TransactionType: 'EscrowCreate',
      Account: 'issuer_r_address',
      Destination: 'rGNZ4eXcwqCjcqAR9RWX5vcDJ8wH1upLZB',
      Amount: monthly,
      FinishAfter: Math.floor(Date.now() / 1000) + (month * 2592000), // 30 days
    };
    await client.submit(monthlyTx, { wallet: issuerWallet, autofill: true });
  }
  await client.disconnect();
}
