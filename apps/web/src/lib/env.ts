const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL?.trim() || 'http://127.0.0.1:5000/graphql'
const ipfsGatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL?.trim() || 'http://127.0.0.1:18080'
const chainRpcUrl = import.meta.env.VITE_CHAIN_RPC_URL?.trim() || 'http://127.0.0.1:8545'
const evidenceAnchorAddress =
  import.meta.env.VITE_EVIDENCE_ANCHOR_ADDRESS?.trim() || '0x0000000000000000000000000000000000000000'

export const env = {
  graphqlUrl,
  ipfsGatewayUrl,
  chainRpcUrl,
  evidenceAnchorAddress,
}
