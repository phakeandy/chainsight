/// <reference types="vite/client" />

import type { Eip1193Provider } from 'viem'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}
