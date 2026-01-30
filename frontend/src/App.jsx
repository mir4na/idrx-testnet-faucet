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


  const handleConnect = (connector) => {
    console.log("Connecting with connector:", connector.name)
    connect({ connector })
    setShowWalletModal(false)
  }

  useEffect(() => {
    if (isSuccess) {
      console.log("Transaction success!")
      setShowSuccess(true)
      refetchBalance()
      refetchCanClaim()
      setTimeout(() => setShowSuccess(false), 4000)
    }
  }, [isSuccess, refetchBalance, refetchCanClaim])

  const handleClaim = () => {
    console.log("handleClaim called. State:", { canClaim, isPending, isConfirming })
    if (!canClaim || isPending || isConfirming) {
      console.warn("Claim aborted. Conditions not met.")
      return
    }
    console.log("Initiating claim...")
    claim()
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

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

      <main className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-6 glow">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gradient mb-4 animate-float">
                <span className="text-2xl font-bold text-white">₹</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                Get Free <span className="gradient-text">IDRX</span>
              </h2>
              <p className="text-sm text-gray-400">
                {formatIDRX(dripAmount)} IDRX every 30 minutes
              </p>
            </div>

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
                className={`w-full py-3 rounded-xl font-medium transition-all ${isLoading
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

          <div className="grid grid-cols-3 gap-2 mt-4">
            <StatCard label="Faucet Balance" value={formatIDRX(faucetBalance)} unit="IDRX" />
            <StatCard label="Per Claim" value={formatIDRX(dripAmount)} unit="IDRX" />
            <StatCard label="Total Claims" value={totalClaims.toString()} unit="users" />
          </div>

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
                console.log("Add IDRX to Wallet clicked")
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
                  console.log("Wallet watchAsset request sent")
                } catch (e) {
                  console.error("Error adding token:", e)
                }
              }}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Add IDRX to Wallet
            </button>
          </div>
        </div>
      </main>

      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWalletModal(false)}
          />

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
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <ConnectorIcon type={connector.id} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{connector.name}</p>
                    <p className="text-xs text-gray-500">Connect to your wallet</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
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

function ConnectorIcon({ type }) {
  if (type.includes('coinbase')) {
    return (
      <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM6.85714 6.85714H17.1429V17.1429H6.85714V6.85714Z" />
      </svg>
    )
  }
  if (type.includes('metaMask')) {
    return (
      <svg className="w-6 h-6 text-orange-500" viewBox="0 0 35 33" fill="none">
        <path d="M32.958 1L19.514 11.218l2.492-5.876L32.958 1z" fill="currentColor" />
        <path d="M2.034 1l13.314 10.313-2.362-5.97L2.034 1zM28.11 23.89l-3.576 5.476 7.656 2.105 2.2-7.458-6.28-.123zM.994 24.013l2.185 7.458 7.656-2.105-3.576-5.476-6.265.123z" fill="currentColor" />
        <path d="M10.472 14.51l-2.133 3.227 7.593.337-.263-8.167-5.197 4.603zM24.52 14.51l-5.263-4.697-.175 8.26 7.578-.337-2.14-3.226z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
