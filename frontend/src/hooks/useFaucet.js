import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS, FAUCET_ABI, ERC20_ABI } from '../config/wagmi'

export function useFaucetData(address) {
  const { data: canClaimData, refetch: refetchCanClaim } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'canClaim',
    args: [address],
    query: {
      enabled: !!address && CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: dripAmount } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'dripAmount',
    query: {
      enabled: CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: faucetBalance } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'getFaucetBalance',
    query: {
      enabled: CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: remainingClaims } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'getRemainingClaims',
    query: {
      enabled: CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: totalDistributed } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'totalDistributed',
    query: {
      enabled: CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: totalClaims } = useReadContract({
    address: CONTRACTS.IDRX_FAUCET,
    abi: FAUCET_ABI,
    functionName: 'totalClaims',
    query: {
      enabled: CONTRACTS.IDRX_FAUCET !== '0x0000000000000000000000000000000000000000',
    },
  })

  return {
    canClaim: canClaimData?.[0] ?? false,
    remainingCooldown: canClaimData?.[1] ? Number(canClaimData[1]) : 0,
    dripAmount: dripAmount ? Number(dripAmount) : 1000000,
    faucetBalance: faucetBalance ? Number(faucetBalance) : 0,
    remainingClaims: remainingClaims ? Number(remainingClaims) : 0,
    totalDistributed: totalDistributed ? Number(totalDistributed) : 0,
    totalClaims: totalClaims ? Number(totalClaims) : 0,
    refetchCanClaim,
  }
}

export function useUserBalance(address) {
  const { data: balance, refetch } = useReadContract({
    address: CONTRACTS.IDRX_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  })

  return {
    balance: balance ? Number(balance) : 0,
    refetch,
  }
}

export function useClaimTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  if (error) {
    console.error("useClaimTokens Write Contract Error:", error)
  }

  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  if (receiptError) {
    console.error("useClaimTokens Receipt Error:", receiptError)
  }

  const claim = () => {
    console.log("useClaimTokens: claim() called using faucet address:", CONTRACTS.IDRX_FAUCET)
    try {
      writeContract({
        address: CONTRACTS.IDRX_FAUCET,
        abi: FAUCET_ABI,
        functionName: 'claim',
      }, {
        onError: (err) => console.error("writeContract onError:", err),
        onSuccess: (data) => console.log("writeContract onSuccess, hash:", data)
      })
    } catch (e) {
      console.error("writeContract exception:", e)
    }
  }

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error || receiptError,
  }
}
