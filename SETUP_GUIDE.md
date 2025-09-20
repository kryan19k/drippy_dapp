# 🚀 Drippy DeFi Setup Guide

## Quick Start

This guide will help you set up your Drippy development environment and admin dashboard.

### Prerequisites

- Node.js 18+ installed
- Git installed
- Xaman account for testing
- Access to Xahau testnet/mainnet

## Step 1: Environment Configuration

### Backend Setup

1. **Copy environment template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure Xaman credentials:**
   ```bash
   # Get these from https://apps.xumm.app
   XUMM_API_KEY=your_xaman_api_key_here
   XUMM_API_SECRET=your_xaman_api_secret_here
   ```

3. **Set up hook accounts:**
   ```bash
   # Generate new accounts or use existing ones
   HOOK_POOL_ACCOUNT=rClaimPoolAccountAddress
   HOOK_FEE_ROUTER_ACCOUNT=rFeeRouterAccountAddress
   HOOK_ADMIN_SEED=sAdminSeedForHookManagement
   ```

4. **Configure networks:**
   ```bash
   # For testnet development
   XAHAU_WSS=wss://xahau-test.net
   XRPL_WSS=wss://s.altnet.rippletest.net:51233

   # For mainnet production
   XAHAU_WSS=wss://xahau.network
   XRPL_WSS=wss://xrplcluster.com
   ```

### Frontend Setup

1. **Copy environment template:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Configure API endpoint:**
   ```bash
   VITE_API_BASE=http://localhost:8787
   ```

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 3: Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Step 4: Access Admin Dashboard

1. **Open your browser:**
   ```
   http://localhost:5173
   ```

2. **Connect your admin wallet:**
   - Click "Connect Wallet"
   - Use Xaman to connect
   - Navigate to `/admin`

3. **Admin Dashboard Features:**
   - Hook status monitoring
   - Manual accrual adjustments
   - Pool balance management
   - Transaction monitoring
   - System logs

## Step 5: Hook Deployment

### Compile Hooks

```bash
cd backend/hooks
make build
```

### Deploy Claim Hook

```bash
# Generate SetHook transaction
npm run gen:sethook

# Deploy to network
npm run deploy:hook
```

### Deploy Fee Router Hook

Use the admin dashboard:
1. Go to "Hook Management" tab
2. Click "Deploy Fee Router"
3. Configure allocation percentages
4. Sign with admin wallet

## Step 6: Start Indexer

```bash
cd backend
npm run indexer
```

## Admin Dashboard Usage

### Hook Management

**View Hook Status:**
- Real-time deployment status
- Hook account addresses
- Current parameters
- State information

**Deploy Hooks:**
- Fee router hook deployment
- Parameter configuration
- Transaction monitoring

### Accrual Management

**Manual Adjustments:**
- Add rewards to specific accounts
- Specify accrual type (HOLDER, NFT, STAKING)
- Track adjustment history

**View Accruals:**
- Recent accrual history
- Account-specific balances
- Total system accruals

### Pool Management

**Monitor Balances:**
- NFT Rewards Pool (40%)
- Holder Rewards Pool (30%)
- Treasury Pool (20%)
- AMM Pool (10%)

**Pool Operations:**
- Top up pools
- Withdraw from pools
- Monitor allocation percentages

### Transaction Monitoring

**Real-time Tracking:**
- Claims processed
- Fee distributions
- Hook deployments
- Failed transactions

### System Health

**Monitor Status:**
- Hook deployment status
- Indexer health
- Network connectivity
- Pool balances

## Advanced Configuration

### Custom Hook Parameters

Edit hook parameters in admin dashboard or directly:

```javascript
// Claim Hook Parameters
{
  ADMIN: "rAdminAccountAddress",
  MAXP: "1000000000",  // 1000 DRIPPY max per claim
  COOLD: "3600"        // 1 hour cooldown
}

// Fee Router Parameters
{
  NFT_ALLOC: 40,       // 40% to NFT holders
  HOLDER_ALLOC: 30,    // 30% to token holders
  TREASURY_ALLOC: 20,  // 20% to treasury
  AMM_ALLOC: 10        // 10% to AMM
}
```

### Security Configuration

1. **Admin Account Setup:**
   ```bash
   # Add multiple admin accounts
   ADMIN_ACCOUNTS=rAdmin1,rAdmin2,rAdmin3
   ```

2. **Network Security:**
   ```bash
   # Restrict frontend origin in production
   FRONTEND_ORIGIN=https://yourdomain.com
   ```

### Production Deployment

1. **Environment Variables:**
   - Use production Xaman credentials
   - Set mainnet WSS endpoints
   - Configure proper admin accounts

2. **Security Measures:**
   - Enable HTTPS
   - Restrict CORS origins
   - Use environment secrets management

3. **Monitoring:**
   - Set up error tracking
   - Configure log aggregation
   - Monitor hook performance

## Troubleshooting

### Common Issues

**Connection Problems:**
```bash
# Check network connectivity
curl -X GET http://localhost:8787/health

# Verify WSS connections
# Check browser console for WebSocket errors
```

**Hook Deployment Issues:**
```bash
# Verify admin seed is correct
# Check account has sufficient XRP
# Ensure hook bytecode compiled correctly
```

**Accrual Problems:**
```bash
# Check hook state
# Verify admin permissions
# Check account format (starts with 'r')
```

### Debug Mode

Enable detailed logging:

```bash
# Backend
DEBUG=drippy:* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

## API Reference

### Admin Endpoints

```bash
# System Health
GET /admin/system/health

# Hook Status
GET /admin/hooks/status

# Deploy Fee Router
POST /admin/hooks/deploy-router

# Manual Accrual
POST /admin/accrual/adjust

# Pool Balances
GET /admin/pools/balances

# Recent Transactions
GET /admin/transactions/recent

# System Logs
GET /admin/logs
```

## Next Steps

1. **Complete Hook Infrastructure**
   - Deploy both hooks to testnet
   - Test end-to-end reward flow
   - Verify all admin functions

2. **Implement Real Data**
   - Replace mock data with live XRPL calls
   - Connect indexer to actual networks
   - Add real-time WebSocket feeds

3. **Add Advanced Features**
   - NFT reward tracking
   - Governance proposals
   - Analytics dashboard

4. **Security Audit**
   - Review hook code
   - Test admin access controls
   - Validate transaction flows

5. **Production Deployment**
   - Deploy to mainnet
   - Configure monitoring
   - Launch to users

---

**Need Help?** Check the documentation or reach out for support with your Drippy implementation.