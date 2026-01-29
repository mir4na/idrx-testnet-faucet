import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import { useFaucetData, useUserBalance, useClaimTokens } from './hooks/useFaucet'
import { formatIDRX, formatTime, shortenAddress } from './config/constants'
import { CONTRACTS } from './config/wagmi'

export default function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { canClaim, remainingCooldown, dripAmount, faucetBalance, totalClaims, refetchCanClaim } = useFaucetData(address)
  const { balance, refetch: refetchBalance } = useUserBalance(address)
  const { claim, isPending, isConfirming, isSuccess, error } = useClaimTokens()

  const [countdown, setCountdown] = useState(remainingCooldown)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const isFaucetConfigured = CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000'

  // Find connectors
  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK')
  const metaMaskConnector = connectors.find(c => c.id === 'metaMaskSDK' || c.id === 'metaMask')
  const injectedConnector = connectors.find(c => c.id === 'injected')

  useEffect(() => {
    setCountdown(remainingCooldown)
  }, [remainingCooldown])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refetchCanClaim()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, refetchCanClaim])

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      refetchBalance()
      refetchCanClaim()
      setTimeout(() => setShowSuccess(false), 4000)
    }
  }, [isSuccess, refetchBalance, refetchCanClaim])

  const handleClaim = () => {
    if (!canClaim || isPending || isConfirming) return
    claim()
  }

  const handleConnect = (connector) => {
    connect({ connector })
    setShowWalletModal(false)
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center glow-sm">
            <span className="text-white font-bold text-sm">IDR</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">IDRX Faucet</h1>
            <p className="text-xs text-gray-500">Base Sepolia</p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white font-medium">{shortenAddress(address)}</span>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowWalletModal(true)}
            className="btn-gradient px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all glow-sm"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="glass rounded-2xl p-6 glow">
            {/* Token Icon & Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gradient mb-4 animate-float">
                <span className="text-2xl font-bold text-white">₹</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                Get Free <span className="gradient-text">IDRX</span>
              </h2>
              <p className="text-sm text-gray-400">
                {formatIDRX(dripAmount)} IDRX every 24 hours
              </p>
            </div>

            {/* Balance Card */}
            {isConnected && (
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Your Balance</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{formatIDRX(balance)}</span>
                    <span className="text-xs text-primary font-medium">IDRX</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Area */}
            {!isFaucetConfigured ? (
              <div className="text-center py-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="text-yellow-400 text-sm">Faucet not configured</p>
                <p className="text-gray-500 text-xs mt-1">Set VITE_FAUCET_ADDRESS</p>
              </div>
            ) : !isConnected ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="w-full py-3 rounded-xl btn-gradient text-white font-medium hover:opacity-90 transition-all glow-sm"
              >
                Connect Wallet to Claim
              </button>
            ) : countdown > 0 ? (
              <div className="text-center">
                <div className="bg-muted/50 rounded-xl p-4 mb-3">
                  <p className="text-xs text-gray-400 mb-1">Next claim in</p>
                  <p className="text-2xl font-bold text-white">{formatTime(countdown)}</p>
                </div>
                <button disabled className="w-full py-3 rounded-xl bg-muted text-gray-500 font-medium cursor-not-allowed">
                  Please Wait
                </button>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={!canClaim || isLoading}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  isLoading
                    ? 'bg-primary/50 text-white/70 cursor-wait'
                    : 'btn-gradient text-white hover:opacity-90 glow-sm'
                }`}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Confirm in Wallet...
                  </span>
                ) : isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Processing...
                  </span>
                ) : (
                  `Claim ${formatIDRX(dripAmount)} IDRX`
                )}
              </button>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 text-sm">
                  {formatIDRX(dripAmount)} IDRX claimed!
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && !showSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs">
                  {error.message?.includes('CooldownNotExpired')
                    ? 'Cooldown not expired yet'
                    : error.message?.includes('InsufficientFaucetBalance')
                    ? 'Faucet is empty'
                    : 'Transaction failed'}
                </p>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <StatCard label="Faucet Balance" value={formatIDRX(faucetBalance)} unit="IDRX" />
            <StatCard label="Per Claim" value={formatIDRX(dripAmount)} unit="IDRX" />
            <StatCard label="Total Claims" value={totalClaims.toString()} unit="users" />
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACTS.IDRX_FAUCET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              View Contract
            </a>
            <span className="text-gray-700">•</span>
            <button
              onClick={async () => {
                try {
                  await window.ethereum?.request({
                    method: 'wallet_watchAsset',
                    params: {
                      type: 'ERC20',
                      options: {
                        address: CONTRACTS.IDRX_TOKEN,
                        symbol: 'IDRX',
                        decimals: 2,
                      },
                    },
                  })
                } catch (e) {}
              }}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Add IDRX to Wallet
            </button>
          </div>
        </div>
      </main>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWalletModal(false)}
          />

          {/* Modal */}
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Connect Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Coinbase / Base Wallet */}
              {coinbaseConnector && (
                <button
                  onClick={() => handleConnect(coinbaseConnector)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0052FF]/10 border border-[#0052FF]/30 hover:bg-[#0052FF]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm-4.5 20.5h9c.276 0 .5-.224.5-.5v-8c0-.276-.224-.5-.5-.5h-9c-.276 0-.5.224-.5.5v8c0 .276.224.5.5.5z"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">Coinbase Wallet</p>
                    <p className="text-xs text-gray-400">Sign in with Base</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* MetaMask */}
              {(metaMaskConnector || injectedConnector) && (
                <button
                  onClick={() => handleConnect(metaMaskConnector || injectedConnector)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#F6851B]/10 border border-[#F6851B]/30 hover:bg-[#F6851B]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6851B] flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 35 33" fill="none">
                      <path d="M32.958 1L19.514 11.218l2.492-5.876L32.958 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.034 1l13.314 10.313-2.362-5.97L2.034 1zM28.11 23.89l-3.576 5.476 7.656 2.105 2.2-7.458-6.28-.123zM.994 24.013l2.185 7.458 7.656-2.105-3.576-5.476-6.265.123z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.472 14.51l-2.133 3.227 7.593.337-.263-8.167-5.197 4.603zM24.52 14.51l-5.263-4.697-.175 8.26 7.578-.337-2.14-3.226zM10.835 29.366l4.572-2.233-3.948-3.083-.624 5.316zM19.585 27.133l4.587 2.233-.638-5.316-3.949 3.083z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24.172 29.366l-4.587-2.233.367 2.997-.04 1.263 4.26-2.027zM10.835 29.366l4.26 2.027-.027-1.263.352-2.997-4.585 2.233z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.173 22.396l-3.81-1.12 2.69-1.235 1.12 2.355zM19.812 22.396l1.12-2.355 2.703 1.235-3.823 1.12z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.835 29.366l.649-5.476-4.225.123 3.576 5.353zM23.508 23.89l.664 5.476 3.576-5.353-4.24-.123zM26.66 17.737l-7.578.337.703 3.91 1.12-2.355 2.703 1.235 3.052-3.127zM11.363 20.864l2.69-1.235 1.12 2.355.716-3.91-7.593-.337 3.067 3.127z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.296 17.737l3.163 6.168-.106-3.041-3.057-3.127zM23.608 20.864l-.119 3.041 3.17-6.168-3.051 3.127zM15.89 18.074l-.717 3.91.9 4.634.201-6.107-.385-2.437zM19.082 18.074l-.372 2.424.188 6.12.9-4.634-.716-3.91z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.785 22.396l-.9 4.634.649.45 3.948-3.082.12-3.041-3.817 1.039zM11.363 21.357l.106 3.041 3.948 3.082.649-.45-.9-4.634-3.803-1.039z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.866 31.393l.04-1.263-.34-.296h-5.14l-.326.296.026 1.263-4.26-2.027 1.49 1.221 3.016 2.092h5.228l3.03-2.092 1.476-1.22-4.24 2.026z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.585 27.133l-.649-.45h-3.879l-.649.45-.352 2.997.326-.296h5.14l.34.296-.277-2.997z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M33.523 11.847l1.14-5.502L32.958 1l-13.373 9.914 5.144 4.348 7.27 2.118 1.607-1.872-.696-.503 1.11-1.013-.854-.66 1.11-.846-.729-.54zM.33 6.345l1.154 5.502-.74.54 1.11.846-.84.66 1.11 1.013-.71.503 1.607 1.872 7.27-2.118 5.144-4.348L2.034 1 .33 6.345z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M31.999 17.38l-7.27-2.118 2.2 3.227-3.17 6.168 4.175-.053h6.226l-2.16-7.224zM10.264 15.262l-7.27 2.118-2.146 7.224h6.212l4.161.053-3.163-6.168 2.206-3.227zM19.082 18.486l.464-8.032 2.106-5.699h-9.33l2.094 5.699.477 8.032.175 2.45.013 6.094h3.88l.026-6.093.095-2.451z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">MetaMask</p>
                    <p className="text-xs text-gray-400">Browser extension</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              By connecting, you agree to the terms of service
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, unit }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="text-[10px] text-gray-500">{unit}</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
