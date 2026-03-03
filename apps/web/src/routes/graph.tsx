import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import ForceGraph2D from 'react-force-graph-2d'
import { useEffect, useMemo, useState } from 'react'

import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { fetchGraphEdges, fetchGraphNodes } from '../lib/graphql/api'
import { queryKeys } from '../lib/graphql/query-keys'

type GraphNode = {
  id: string
  cid: string | null
  aiLabel: string | null
  status: string
  submitterAddress: string
}

type GraphLink = {
  id: string
  source: string
  target: string
  score: number
  edgeType: string
}

export const Route = createFileRoute('/graph')({
  component: GraphPage,
})

function GraphPage() {
  const navigate = Route.useNavigate()
  const [graphContainer, setGraphContainer] = useState<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(900)
  const [limitCount, setLimitCount] = useState(200)
  const [minScore, setMinScore] = useState(0.8)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (!graphContainer) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width
      if (nextWidth && Number.isFinite(nextWidth)) {
        setContainerWidth(Math.max(320, Math.floor(nextWidth)))
      }
    })

    observer.observe(graphContainer)
    return () => observer.disconnect()
  }, [graphContainer])

  const nodesQuery = useQuery({
    queryKey: queryKeys.graphNodes(limitCount),
    queryFn: () => fetchGraphNodes({ limitCount }),
  })

  const edgesQuery = useQuery({
    queryKey: queryKeys.graphEdges(1000, minScore),
    queryFn: () => fetchGraphEdges({ limitCount: 1000, minScore }),
  })

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = (nodesQuery.data ?? []).map((node) => ({
      id: node.id,
      cid: node.cid ?? null,
      aiLabel: node.aiLabel ?? null,
      status: node.status,
      submitterAddress: node.submitterAddress,
    }))

    const links: GraphLink[] = (edgesQuery.data ?? []).map((edge) => ({
      id: edge.id,
      source: edge.sourceEvidenceId,
      target: edge.targetEvidenceId,
      score: edge.score,
      edgeType: edge.edgeType,
    }))

    return { nodes, links }
  }, [nodesQuery.data, edgesQuery.data])

  const selectedNode = useMemo(
    () => graphData.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graphData.nodes, selectedNodeId],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">图谱视图</h1>
          <p className="text-sm text-muted-foreground">基于 semantic 边展示可交互的信息传播图谱。</p>
        </div>
        <Link
          to="/submit"
          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          返回提交页
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>图谱参数</CardTitle>
          <CardDescription>渲染前可调整查询范围。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="limit-count">节点上限</Label>
            <Input
              id="limit-count"
              type="number"
              min={1}
              max={1000}
              value={limitCount}
              onChange={(event) => setLimitCount(Number(event.target.value) || 200)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-score">最小相似度</Label>
            <Input
              id="min-score"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FR-03：图谱可视化</CardTitle>
          <CardDescription>使用 GraphQL 图节点与 semantic 边构建交互式传播图。</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={setGraphContainer} className="h-[520px] rounded-md border border-dashed">
            {nodesQuery.isLoading || edgesQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">正在加载图谱数据...</div>
            ) : nodesQuery.isError || edgesQuery.isError ? (
              <div className="flex h-full items-center justify-center text-sm text-destructive">图谱数据查询失败。</div>
            ) : graphData.nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无可展示的图谱数据。</div>
            ) : (
              <ForceGraph2D
                graphData={graphData}
                width={containerWidth}
                height={520}
                nodeLabel={(node) => `${(node as GraphNode).id} ${(node as GraphNode).aiLabel ?? ''}`}
                nodeAutoColorBy="aiLabel"
                linkLabel={(link) => `${(link as GraphLink).edgeType} score=${(link as GraphLink).score.toFixed(3)}`}
                linkLineDash={(link) => ((link as GraphLink).edgeType === 'semantic' ? [] : [4, 3])}
                linkWidth={(link) => (link as GraphLink).score * 2}
                onNodeClick={(node) => {
                  const clicked = node as GraphNode
                  setSelectedNodeId(clicked.id)
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>当前选中节点</CardTitle>
          <CardDescription>点击图节点后可查看信息并跳转详情页。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!selectedNode ? (
            <p className="text-muted-foreground">尚未选中节点。</p>
          ) : (
            <>
              <p>节点 ID：{selectedNode.id}</p>
              <p>CID: {selectedNode.cid ?? 'N/A'}</p>
              <p>状态：{selectedNode.status}</p>
              <p>AI 标签：{selectedNode.aiLabel ?? 'N/A'}</p>
              <p>提交地址：{selectedNode.submitterAddress}</p>
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => navigate({ to: '/evidence/$evidenceId', params: { evidenceId: selectedNode.id } })}
              >
                打开证据详情
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
