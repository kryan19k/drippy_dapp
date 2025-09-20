#include <xrpl.h>

int64_t hook(int64_t reserved) {
  // Check transaction type
  int64_t tx_type = tx_type();
  if (tx_type != BUY && tx_type != SELL) return 0;

  // Anti-sniping: 50% sell tax for 1 hour
  int64_t amount = tx_amount();
  if (ledger_time() < 1726216800 + 3600 && tx_type == SELL) { // 10-11 AM WAT, Sep 12, 2025
    if (!is_whitelisted(tx_account(), "issuer_r_address,rae3QB8qYkseWuNmkmHGXQJHFybSQ3115J,rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ")) {
      int64_t fee = amount * 0.5;
      transfer("rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ", fee, "DRIPPY", "issuer_r_address");
      amount -= fee;
    }
  }

  // Normal 5% fee
  int64_t fee = amount * 0.05;
  int64_t nft_reward_drippy = fee * 0.01; // 1% for NFT holders
  int64_t holder_reward = fee * 0.02; // 2% for token holders
  int64_t treasury = fee * 0.01; // 1% Treasury
  int64_t amm_deposit = fee * 0.01; // 1% AMM
  int64_t xrp_lp = fee * 0.005; // 0.5% XRP LP
  int64_t drippy_lp = fee * 0.005; // 0.5% $DRIPPY LP

  // NFT rewards in XRP (~$0.00016966 per $DRIPPY)
  int64_t nft_reward_xrp = (nft_reward_drippy * 16966) / 1000000;
  int64_t total_nfts = 0;
  int64_t holders[100];
  int64_t nft_counts[100];
  int64_t holder_count = query_nft_holders(holders, nft_counts, 5); // NFTokenPage
  for (int i = 0; i < holder_count; i++) {
    total_nfts += nft_counts[i];
  }
  for (int i = 0; i < holder_count; i++) {
    int64_t share = (nft_reward_xrp * nft_counts[i]) / total_nfts;
    if (share > 0) {
      transfer(holders[i], share, "XRP", NULL);
    }
  }

  // Token holder rewards in $DRIPPY
  int64_t total_tokens = query_token_holders("DRIPPY", "issuer_r_address");
  int64_t token_holders[100];
  int64_t token_balances[100];
  int64_t token_holder_count = query_token_balances(token_holders, token_balances);
  for (int i = 0; i < token_holder_count; i++) {
    int64_t share = (holder_reward * token_balances[i]) / total_tokens;
    if (share > 0) {
      transfer(token_holders[i], share, "DRIPPY", "issuer_r_address");
    }
  }

  // Other distributions
  transfer("rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ", treasury, "DRIPPY", "issuer_r_address");
  amm_deposit_function("rae3QB8qYkseWuNmkmHGXQJHFybSQ3115J", amm_deposit);
  lp_inject("xrp_lp_wallet", xrp_lp, "DRIPPY", "issuer_r_address");
  lp_inject("drippy_lp_wallet", drippy_lp, "DRIPPY", "issuer_r_address");

  return 0;
}
