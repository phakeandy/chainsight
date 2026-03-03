import { useCallback, useMemo, useState } from 'react'
import { createWalletClient, custom, getAddress, type WalletClient } from 'viem'

import { getEthereumProvider } from '../lib/wallet/provider'

type UseWalletResult = {
  address: string | null
  walletClient: WalletClient | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
}

export function useWallet(): UseWalletResult {
  const [address, setAddress] = useState<string | null>(null)
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    const provider = getEthereumProvider()
    if (!provider) {
      setError('浏览器未检测到 MetaMask（或 EIP-1193 钱包）。')
      return
    }

    setError(null)
    setIsConnecting(true)

    try {
      const client = createWalletClient({
        transport: custom(provider),
      })

      const [account] = await client.requestAddresses()
      if (!account) {
        throw new Error('钱包提供方未返回地址。')
      }

      setWalletClient(client)
      setAddress(getAddress(account))
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : '连接钱包失败。'
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  return useMemo(
    () => ({
      address,
      walletClient,
      isConnecting,
      error,
      connect,
    }),
    [address, walletClient, isConnecting, error, connect],
  )
}
