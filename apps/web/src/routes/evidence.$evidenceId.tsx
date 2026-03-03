import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { type Address } from 'viem'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useWallet } from '../hooks/use-wallet'
import { anchorEvidenceCid } from '../lib/contract/evidence-anchor'
import { getCachedEvidenceSignature } from '../lib/evidence/local-signature-cache'
import { parseEvidencePayload } from '../lib/evidence/payload'
import { env } from '../lib/env'
import { recordAnchorTx, fetchGraphEdges, fetchGraphNodeDetail } from '../lib/graphql/api'
import { queryKeys } from '../lib/graphql/query-keys'
import { fetchIpfsContentByCid } from '../lib/ipfs/fetch-content'
import { verifyEvidenceSignature } from '../lib/wallet/signature'

export const Route = createFileRoute('/evidence/$evidenceId')({
  component: EvidenceDetailPage,
})

const zeroAddress = '0x0000000000000000000000000000000000000000'

function EvidenceDetailPage() {
  const { evidenceId } = Route.useParams()
  const wallet = useWallet()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: queryKeys.graphNodeDetail(evidenceId),
    queryFn: () => fetchGraphNodeDetail({ nodeId: evidenceId }),
    refetchInterval: (query) => {
      const detail = query.state.data
      if (!detail) {
        return 2_000
      }
      const isPending = detail.status === 'PENDING_UPLOAD' || detail.status === 'CID_READY'
      return isPending ? 2_000 : false
    },
  })

  const edgesQuery = useQuery({
    queryKey: queryKeys.graphEdges(1000, 0.8),
    queryFn: () => fetchGraphEdges({ limitCount: 1000, minScore: 0.8 }),
  })

  const detail = detailQuery.data ?? null
  const parsedPayload = useMemo(() => (detail ? parseEvidencePayload(detail.content) : null), [detail])
  const cachedSignature = useMemo(() => getCachedEvidenceSignature(evidenceId), [evidenceId])

  const ipfsQuery = useQuery({
    queryKey: ['ipfsContent', detail?.cid],
    queryFn: () => fetchIpfsContentByCid(detail?.cid ?? ''),
    enabled: Boolean(detail?.cid),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const signatureQuery = useQuery({
    queryKey: ['signatureValidity', evidenceId, detail?.submitterAddress, detail?.content, cachedSignature],
    queryFn: () => {
      if (!detail || !cachedSignature) {
        return Promise.resolve(false)
      }
      return verifyEvidenceSignature(detail.content, cachedSignature, detail.submitterAddress)
    },
    enabled: Boolean(detail?.content && detail?.submitterAddress && cachedSignature),
  })

  const relatedEdges = useMemo(() => {
    const edges = edgesQuery.data ?? []
    return edges.filter((edge) => edge.sourceEvidenceId === evidenceId || edge.targetEvidenceId === evidenceId)
  }, [edgesQuery.data, evidenceId])

  const anchorMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.walletClient || !wallet.address) {
        throw new Error('请先连接钱包，再执行链上锚定。')
      }
      if (!detail?.cid) {
        throw new Error('CID 尚未就绪。')
      }
      if (env.evidenceAnchorAddress === zeroAddress) {
        throw new Error('VITE_EVIDENCE_ANCHOR_ADDRESS 尚未配置。')
      }

      const chainResult = await anchorEvidenceCid(
        wallet.walletClient,
        wallet.address as Address,
        env.evidenceAnchorAddress as Address,
        detail.cid,
      )

      await recordAnchorTx({
        evidenceId,
        chainId: String(chainResult.chainId),
        contractAddress: env.evidenceAnchorAddress,
        txHash: chainResult.txHash,
        senderAddress: wallet.address,
        onchainEvidenceId: chainResult.onchainEvidenceId ? chainResult.onchainEvidenceId.toString() : null,
      })

      await queryClient.invalidateQueries({ queryKey: queryKeys.graphNodeDetail(evidenceId) })
      return chainResult.txHash
    },
  })

  const isBusy = detailQuery.isLoading || edgesQuery.isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">证据详情</h1>
          <p className="text-sm text-muted-foreground">证据 ID：{evidenceId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">AI 置信度：N/A</Badge>
          <Link
            to="/graph"
            className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            打开图谱
          </Link>
        </div>
      </div>

      {isBusy ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 正在加载证据详情...
          </CardContent>
        </Card>
      ) : null}

      {!isBusy && !detail ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">未找到该证据 ID 对应的详情。</CardContent>
        </Card>
      ) : null}

      {detail ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>锚定与身份</CardTitle>
              <CardDescription>FR-04：用户主权交互模式。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>状态：{detail.status}</p>
              <p>提交地址：{detail.submitterAddress}</p>
              <p>CID：{detail.cid ?? '未就绪'}</p>
              <p>
                签名校验：{' '}
                {signatureQuery.isLoading
                  ? '校验中...'
                  : signatureQuery.data
                    ? '签名有效，且与提交地址一致'
                    : cachedSignature
                      ? '签名无效'
                      : 'N/A（当前浏览器缓存中无签名）'}
              </p>
              <p>当前钱包：{wallet.address ?? '未连接'}</p>
              {wallet.error ? <p className="text-destructive">{wallet.error}</p> : null}
              {anchorMutation.isError ? (
                <p className="text-destructive">{anchorMutation.error instanceof Error ? anchorMutation.error.message : '锚定失败。'}</p>
              ) : null}
              {anchorMutation.isSuccess ? <p>链上锚定交易已提交：{anchorMutation.data}</p> : null}
              <div className="flex gap-2">
                <Button onClick={wallet.connect} disabled={wallet.isConnecting || !!wallet.address}>
                  {wallet.isConnecting ? '连接中...' : wallet.address ? '钱包已连接' : '连接钱包'}
                </Button>
                <Button
                  variant="outline"
                  disabled={!wallet.address || !detail.cid || detail.status === 'ANCHORED' || anchorMutation.isPending}
                  onClick={() => anchorMutation.mutate()}
                >
                  {anchorMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> 锚定中
                    </span>
                  ) : (
                    '执行链上锚定'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>证据原文</CardTitle>
              <CardDescription>CID 就绪后，优先从 IPFS gateway 拉取内容。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {ipfsQuery.isLoading ? <p>正在从 IPFS 加载内容...</p> : null}
              {ipfsQuery.isError ? (
                <p className="text-destructive">
                  {ipfsQuery.error instanceof Error ? ipfsQuery.error.message : 'IPFS 拉取失败，已回退到数据库存储内容。'}
                </p>
              ) : null}
              <pre className="max-h-80 overflow-auto rounded-md border bg-muted/20 p-3 whitespace-pre-wrap break-words">
                {ipfsQuery.data ?? parsedPayload?.content ?? detail.content}
              </pre>
              <p className="text-muted-foreground">来源 URL：{parsedPayload?.sourceUrl ?? 'N/A'}</p>
              <p className="text-muted-foreground">提交时间：{parsedPayload?.timestamp ?? detail.createdAt}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FR-02：自动化分析</CardTitle>
              <CardDescription>AI 标签与语义邻居关系。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>AI 标签：{detail.aiLabel ?? 'N/A'}</p>
              <p>AI 摘要：{detail.aiSummary ?? 'N/A'}</p>
              <p>出向 semantic 边：{detail.outgoingSemanticEdges}</p>
              <p>入向 semantic 边：{detail.incomingSemanticEdges}</p>
              <div className="space-y-2 pt-2">
                <p className="font-medium">相似证据链接</p>
                {relatedEdges.length === 0 ? (
                  <p className="text-muted-foreground">暂时没有相似证据链接。</p>
                ) : (
                  relatedEdges.map((edge) => {
                    const neighborId = edge.sourceEvidenceId === evidenceId ? edge.targetEvidenceId : edge.sourceEvidenceId
                    return (
                      <div key={edge.id} className="rounded-md border p-2">
                        <p>邻居 ID：{neighborId}</p>
                        <p>相似度：{edge.score.toFixed(3)}</p>
                        <p>边类型：{edge.edgeType}</p>
                        <Link
                          to="/evidence/$evidenceId"
                          params={{ evidenceId: neighborId }}
                          className="text-xs underline underline-offset-4"
                        >
                          打开邻居详情
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
