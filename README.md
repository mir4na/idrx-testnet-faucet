# IDRX Faucet for Base Sepolia

Faucet untuk mendistribusikan token IDRX di Base Sepolia testnet dengan UI modern.

## Features

- **Rate Limiting**: Cooldown 24 jam per address
- **Modern UI**: Desain 3D glassmorphism yang elegan
- **Real-time Stats**: Live tracking claims dan balance
- **Wallet Integration**: Support MetaMask dan wallet injected lainnya

## Project Structure

```
vessel-faucet/
├── contracts/           # Smart contracts
│   ├── IDRXFaucet.sol
│   └── MockERC20.sol
├── scripts/             # Deployment scripts
│   ├── deploy.js
│   └── fund-faucet.js
├── test/                # Contract tests
│   └── IDRXFaucet.test.js
├── frontend/            # React UI
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   └── hooks/
│   └── ...
└── ...
```

## Quick Start

### 1. Install Dependencies

```bash
# Smart contract dependencies
npm install

# Frontend dependencies
cd frontend && npm install
```

### 2. Setup Environment

```bash
# Root folder
cp .env.example .env
# Edit .env with your private key

# Frontend folder
cd frontend
cp .env.example .env
```

### 3. Deploy Contract

```bash
npm run deploy:base-sepolia
```

### 4. Fund Faucet

```bash
npm run fund:base-sepolia
```

### 5. Update Frontend Config

Edit `frontend/.env`:
```
VITE_FAUCET_ADDRESS=<your-deployed-faucet-address>
```

### 6. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## Contract Details

### IDRXFaucet

| Function | Description |
|----------|-------------|
| `claim()` | Claim IDRX tokens (10,000 per claim) |
| `canClaim(address)` | Check if address can claim |
| `getFaucetBalance()` | Get faucet's IDRX balance |
| `getRemainingClaims()` | Get number of claims remaining |

### Configuration

- **Drip Amount**: 10,000 IDRX per claim
- **Cooldown**: 24 hours
- **IDRX Decimals**: 2

## Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| MockIDRX | `0xa44fF300eC504991Ac6Cd88cd29E2CCDC88B6CD3` |
| IDRXFaucet | Deploy dengan script |

## Testing

```bash
npm test
```

## Verify Contract

```bash
npx hardhat verify --network base_sepolia <FAUCET_ADDRESS> <IDRX_TOKEN_ADDRESS>
```
