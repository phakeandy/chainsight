import { defineChain } from 'viem'

/**
 * Hardhat 本地网络配置 (Chain ID: 31337, RPC: http://127.0.0.1:8545)
 */
export const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
})
