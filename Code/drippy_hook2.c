#include <xrpl.h>

int64_t hook(int64_t reserved) {
  // Check transaction type
  int64_t tx_type = tx_type();
  if (tx_type != BUY && tx_type != SELL) return 0;

  // Anti-sniping: 50% sell tax for 1 hour
  int64_t amount = tx_amount();
  if (ledger_time() < 1726150800 + 3600 && tx_type == SELL) { // 6-7 PM WAT, Sep 11
    if (!is_whitelisted(tx_account(), "issuer_r_address,rae3QB8qYkseWuNmkmHGXQJHFybSQ3115J,rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ")) {
      int64_t fee = amount * 0.5; // 50% sell tax
      transfer("rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ", fee, "DRIPPY", "issuer_r_address");
      amount -= fee;
    }
  }

  // Normal 5% fee
  int64_t fee = amount * 0.05;
  int64_t nft_reward_drippy = fee * 0.01; // 1% for NFT holders
  int64_t holder_reward = fee * 0.02; // 2% token holders
  int64_t treasury = fee * 0.01; // 1% Treasury
  int64_t amm_deposit = fee * 0.01; // 1% AMM
  int64_t xrp_lp = fee * 0.005; // 0.5% XRP LP
  int64_t drippy_lp = fee * 0.005; // 0.5% $DRIPPY LP

  // Convert NFT reward to XRP (using AMM price, ~$0.00016966)
  int64_t nft_reward_xrp = (nft_reward_drippy * 16966) / 1000000; // Convert $DRIPPY to XRP drops
  int64_t total_nfts = 0;
  int64_t holders[100]; // Max 100 holders
  int64_t nft_counts[100];
  int64_t holder_count = query_nft_holders(holders, nft_counts, 5); // NFTokenPage
  for (int i = 0; i < holder_count; i++) {
    total_nfts += nft_counts[i];
  }
  for (int i = 0; i < holder_count; i++) {
    int64_t share = (nft_reward_xrp * nft_counts[i]) / total_nfts;
    if (share > 0) {
      transfer(holders[i], share, "XRP", NULL); // Pay in XRP drops
    }
  }

  // Other distributions
  distribute_holders(holder_reward); // Proportional in $DRIPPY
  transfer("rwprJf1ZEU3foKSiwhDg5kj9zDWFtPgMqJ", treasury, "DRIPPY", "issuer_r_address");
  amm_deposit_function("rae3QB8qYkseWuNmkmHGXQJHFybSQ3115J", amm_deposit);
  lp_inject("xrp_lp_wallet", xrp_lp, "DRIPPY", "issuer_r_address");
  lp_inject("drippy_lp_wallet", drippy_lp, "DRIPPY", "issuer_r_address");

  return 0;
}
