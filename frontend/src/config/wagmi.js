import { createConfig, http, custom } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'IDRX Faucet',
      preference: 'all',
    }),
    metaMask({
      dappMetadata: {
        name: 'IDRX Faucet',
      },
    }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

export const CONTRACTS = {
  IDRX_TOKEN: '0xa44fF300eC504991Ac6Cd88cd29E2CCDC88B6CD3',
  IDRX_FAUCET: import.meta.env.VITE_FAUCET_ADDRESS || '0x0000000000000000000000000000000000000000',
}
export const FAUCET_ABI = [
  {
    inputs: [],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'canClaim',
    outputs: [
      { name: 'canClaim', type: 'bool' },
      { name: 'remainingCooldown', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dripAmount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cooldownPeriod',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFaucetBalance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRemainingClaims',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDistributed',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalClaims',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
]
