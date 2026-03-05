import {
  createPublicClient,
  decodeEventLog,
  http,
  parseAbi,
  type Address,
  type Chain,
  type WalletClient,
} from 'viem'

import { env } from '../env'

const hardhatChain: Chain = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [env.chainRpcUrl] },
    public: { http: [env.chainRpcUrl] },
  },
}

const evidenceAnchorAbi = parseAbi([
  'function anchorEvidence(string _ipfsCid) returns (uint256 evidenceId)',
  'event EvidenceAnchored(uint256 indexed evidenceId, string indexed ipfsCid, address indexed submitter, uint256 timestamp)',
])

export type AnchorEvidenceResult = {
  txHash: string
  chainId: number
  onchainEvidenceId: bigint | null
}

export async function anchorEvidenceCid(
  walletClient: WalletClient,
  account: Address,
  contractAddress: Address,
  cid: string,
): Promise<AnchorEvidenceResult> {
  const chainId = await walletClient.getChainId()
  const txHash = await walletClient.writeContract({
    account,
    chain: hardhatChain,
    address: contractAddress,
    abi: evidenceAnchorAbi,
    functionName: 'anchorEvidence',
    args: [cid],
  })

  const publicClient = createPublicClient({
    transport: http(env.chainRpcUrl),
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  let onchainEvidenceId: bigint | null = null
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: evidenceAnchorAbi,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName === 'EvidenceAnchored') {
        const evidenceId = decoded.args.evidenceId
        onchainEvidenceId = typeof evidenceId === 'bigint' ? evidenceId : null
      }
    } catch {
      continue
    }
  }

  return {
    txHash,
    chainId,
    onchainEvidenceId,
  }
}
