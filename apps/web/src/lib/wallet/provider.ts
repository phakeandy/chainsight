import type { EIP1193Provider } from 'viem'

declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

export function getEthereumProvider() {
  return typeof window !== 'undefined' ? window.ethereum : undefined
}
