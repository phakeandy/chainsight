import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import ForceGraph2D from 'react-force-graph-2d'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Network, ArrowLeft } from 'lucide-react'

import { Card } from '../components/ui/card'
import { fetchGraphEdges, fetchGraphNodes } from '../lib/graphql/api'
import { queryKeys } from '../lib/graphql/query-keys'
import { GraphSearch } from '../components/graph/GraphSearch'
import { GraphControls } from '../components/graph/GraphControls'
import { NodeDetailsPanel } from '../components/graph/NodeDetailsPanel'
import { Minimap } from '../components/graph/Minimap'
import { Badge } from '../components/ui/badge'

type GraphNode = {
  id: string
  cid: string | null
  aiLabel: string | null
  aiSummary: string | null
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

type ForceGraphInstance = {
  zoom: (level?: number, duration?: number) => number
  zoomToFit: (duration?: number, padding?: number) => void
  centerAt: (x?: number, y?: number, duration?: number) => void
}

function GraphPage() {
  const navigate = Route.useNavigate()
  const graphRef = useRef<ForceGraphInstance | null>(null)

  const [graphContainer, setGraphContainer] = useState<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(900)
  const [containerHeight, setContainerHeight] = useState(600)

  const [limitCount, setLimitCount] = useState(200)
  const [minScore, setMinScore] = useState(0.8)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchHighlightId, setSearchHighlightId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [aiLabelFilter, setAiLabelFilter] = useState('')

  useEffect(() => {
    if (!graphContainer) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {}
      if (width && Number.isFinite(width)) {
        setContainerWidth(Math.max(320, Math.floor(width)))
      }
      if (height && Number.isFinite(height)) {
        setContainerHeight(Math.max(300, Math.floor(height)))
      }
    })

    observer.observe(graphContainer)
    return () => observer.disconnect()
  }, [graphContainer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null)
        setSearchHighlightId(null)
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
        searchInput?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const nodesQuery = useQuery({
    queryKey: queryKeys.graphNodes(limitCount),
    queryFn: () => fetchGraphNodes({ limitCount }),
  })

  const edgesQuery = useQuery({
    queryKey: queryKeys.graphEdges(1000, minScore),
    queryFn: () => fetchGraphEdges({ limitCount: 1000, minScore }),
  })

  const allNodes = useMemo(() => {
    const nodes: GraphNode[] = (nodesQuery.data ?? []).map((node) => ({
      id: node.id,
      cid: node.cid ?? null,
      aiLabel: node.aiLabel ?? null,
      aiSummary: node.aiSummary ?? null,
      status: node.status,
      submitterAddress: node.submitterAddress,
    }))

    let filtered = nodes
    if (statusFilter) {
      filtered = filtered.filter((n) => n.status === statusFilter)
    }
    if (aiLabelFilter) {
      filtered = filtered.filter((n) => n.aiLabel === aiLabelFilter)
    }

    return filtered
  }, [nodesQuery.data, statusFilter, aiLabelFilter])

  const allLinks = useMemo(() => {
    return (edgesQuery.data ?? []).map((edge) => ({
      id: edge.id,
      source: edge.sourceEvidenceId,
      target: edge.targetEvidenceId,
      score: edge.score,
      edgeType: edge.edgeType,
    }))
  }, [edgesQuery.data])

  const graphData = useMemo(() => {
    const nodeIds = new Set(allNodes.map((n) => n.id))
    const links = allLinks.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))

    let visibleLinks = links
    let visibleNodes = allNodes

    if (selectedNodeId) {
      const connectedNodeIds = new Set<string>([selectedNodeId])
      links.forEach((link) => {
        if (link.source === selectedNodeId) connectedNodeIds.add(link.target)
        if (link.target === selectedNodeId) connectedNodeIds.add(link.source)
      })
      visibleNodes = allNodes.filter((n) => connectedNodeIds.has(n.id))
      visibleLinks = links.filter((l) => connectedNodeIds.has(l.source) && connectedNodeIds.has(l.target))
    }

    return { nodes: visibleNodes, links: visibleLinks }
  }, [allNodes, allLinks, selectedNodeId])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    nodesQuery.data?.forEach((n) => n.status && statuses.add(n.status))
    return Array.from(statuses).sort()
  }, [nodesQuery.data])

  const uniqueAiLabels = useMemo(() => {
    const labels = new Set<string>()
    nodesQuery.data?.forEach((n) => n.aiLabel && labels.add(n.aiLabel))
    return Array.from(labels).sort()
  }, [nodesQuery.data])

  const selectedNode = useMemo(
    () => allNodes.find((node) => node.id === selectedNodeId) ?? null,
    [allNodes, selectedNodeId],
  )

  const handleNodeClick = useCallback((node: { id: string }) => {
    setSelectedNodeId(node.id)
  }, [])

  const handleSearchSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setSearchHighlightId(nodeId)
    
    setTimeout(() => {
      if (graphRef.current) {
        const node = (graphData as any).nodes.find((n: any) => n.id === nodeId)
        if (node && node.x !== undefined) {
          graphRef.current.centerAt(node.x, node.y, 500)
          graphRef.current.zoom(1.8, 1000)
        }
      }
    }, 100)
  }, [graphData])

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 1.5, 300)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom / 1.5, 300)
    }
  }, [])

  const handleFitToScreen = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 100)
    }
  }, [])

  const handleNavigateToEvidence = useCallback((evidenceId: string) => {
    navigate({ to: '/evidence/$evidenceId', params: { evidenceId } })
  }, [navigate])

  const isLoading = nodesQuery.isLoading || edgesQuery.isLoading
  const isError = nodesQuery.isError || edgesQuery.isError

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <div className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <Link
            to="/submit"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">图谱视图</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {graphData.nodes.length} 节点 / {graphData.links.length} 边
          </Badge>
        </div>

        <GraphSearch nodes={allNodes} onSelectNode={handleSearchSelect} />
      </div>

      <GraphControls
        limitCount={limitCount}
        minScore={minScore}
        statusFilter={statusFilter}
        aiLabelFilter={aiLabelFilter}
        uniqueStatuses={uniqueStatuses}
        uniqueAiLabels={uniqueAiLabels}
        onLimitChange={setLimitCount}
        onMinScoreChange={setMinScore}
        onStatusFilterChange={setStatusFilter}
        onAiLabelFilterChange={setAiLabelFilter}
        onFitToScreen={handleFitToScreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.links.length}
      />

      <div
        ref={setGraphContainer}
        className={`absolute top-14 transition-all duration-200 ${selectedNode ? 'left-64 right-80' : 'left-64'}`}
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">正在加载图谱数据...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex h-full items-center justify-center">
            <Card className="p-6">
              <p className="text-destructive">图谱数据查询失败</p>
            </Card>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Card className="p-6">
              <p className="text-muted-foreground">暂无可展示的图谱数据</p>
            </Card>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef as any}
            graphData={graphData as any}
            width={containerWidth}
            height={containerHeight}
            backgroundColor="#fafafa"
            nodeLabel={(node: any) => {
              const n = node as GraphNode
              return `${n.id}\n${n.aiLabel ?? ''}\n${n.status}`
            }}
            nodeAutoColorBy="aiLabel"
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.aiLabel ?? node.id.slice(0, 8)
              const fontSize = 12 / globalScale
              const nodeSize = 6

              ctx.beginPath()
              ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
              ctx.fillStyle = node.color || '#97c2fc'
              ctx.fill()

              if (searchHighlightId === node.id) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, nodeSize + 3, 0, 2 * Math.PI)
                ctx.strokeStyle = '#ff6b6b'
                ctx.lineWidth = 2 / globalScale
                ctx.stroke()
              }

              if (selectedNodeId === node.id) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, nodeSize + 5, 0, 2 * Math.PI)
                ctx.strokeStyle = '#22c55e'
                ctx.lineWidth = 3 / globalScale
                ctx.stroke()
              }

              ctx.font = `${fontSize}px sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = '#333'
              ctx.fillText(label, node.x, node.y + nodeSize + fontSize)
            }}
            linkLabel={(link) => {
              const l = link as GraphLink
              return `${l.edgeType} score=${l.score.toFixed(3)}`
            }}
            linkLineDash={(link) => ((link as GraphLink).edgeType === 'semantic' ? [] : [4, 3])}
            linkWidth={(link) => (link as GraphLink).score * 2}
            linkColor={(link) => {
              const l = link as GraphLink
              if (selectedNodeId) {
                if (l.source === selectedNodeId || l.target === selectedNodeId) {
                  return '#22c55e'
                }
                return 'rgba(200, 200, 200, 0.3)'
              }
              return 'rgba(150, 150, 150, 0.6)'
            }}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => {
              if (graphRef.current) {
                graphRef.current.zoomToFit(300)
              }
            }}
          />
        )}
      </div>

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          links={allLinks}
          onClose={() => setSelectedNodeId(null)}
          onNavigateToEvidence={handleNavigateToEvidence}
        />
      )}

      <Minimap graphRef={graphRef} />

      <div className="fixed bottom-4 left-72 z-40 text-xs text-muted-foreground">
        按 <kbd className="rounded border bg-muted px-1">Esc</kbd> 取消选择 · <kbd className="rounded border bg-muted px-1">/</kbd> 搜索
      </div>
    </div>
  )
}
