export const CHAIN_INFO = {
  name: 'Base Sepolia',
  chainId: 84532,
  rpcUrl: 'https://base-sepolia.drpc.org',
  blockExplorer: 'https://base-sepolia.blockscout.com',
  currency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
}

export const IDRX_INFO = {
  name: 'IDRX Token',
  symbol: 'IDRX',
  decimals: 2,
  dripAmount: 10000,
  cooldown: 30 * 60,
}

export const formatIDRX = (amount) => {
  if (!amount) return '0'
  const value = Number(amount) / 100
  return new Intl.NumberFormat('id-ID').format(value)
}

export const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 && hours === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

export const shortenAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
