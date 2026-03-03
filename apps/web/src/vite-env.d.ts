/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL?: string
  readonly VITE_IPFS_GATEWAY_URL?: string
  readonly VITE_CHAIN_RPC_URL?: string
  readonly VITE_EVIDENCE_ANCHOR_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
