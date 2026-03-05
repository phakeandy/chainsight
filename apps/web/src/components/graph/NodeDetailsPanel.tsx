import { X, Copy, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface GraphNode {
  id: string
  cid: string | null
  aiLabel: string | null
  status: string
  submitterAddress: string
}

interface GraphLink {
  id: string
  source: string
  target: string
  score: number
  edgeType: string
}

interface NodeDetailsPanelProps {
  node: GraphNode | null
  links: GraphLink[]
  onClose: () => void
  onNavigateToEvidence: (id: string) => void
}

export function NodeDetailsPanel({ node, links, onClose, onNavigateToEvidence }: NodeDetailsPanelProps) {
  if (!node) return null

  const incomingEdges = links.filter((l) => l.target === node.id)
  const outgoingEdges = links.filter((l) => l.source === node.id)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isVerified = node.status === 'Verified' || node.status === 'verified'

  return (
    <div className="fixed right-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-80 transform border-l bg-background shadow-lg transition-transform duration-200">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">节点详情</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">节点 ID</span>
              <Badge variant="outline" className="font-mono text-xs">
                {node.id.slice(0, 8)}...
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => copyToClipboard(node.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => onNavigateToEvidence(node.id)}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                查看详情
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">状态</span>
              <div className="flex items-center gap-1">
                {isVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">{node.status}</span>
              </div>
            </div>

            {node.aiLabel && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI 标签</span>
                <Badge>{node.aiLabel}</Badge>
              </div>
            )}

            {node.cid && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">CID</span>
                <p className="break-all font-mono text-xs">{node.cid}</p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">提交地址</span>
              <div className="flex items-center gap-2">
                <p className="break-all font-mono text-xs">{node.submitterAddress}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => copyToClipboard(node.submitterAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">连接统计</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{incomingEdges.length}</p>
                <p className="text-xs text-muted-foreground">传入边</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{outgoingEdges.length}</p>
                <p className="text-xs text-muted-foreground">传出边</p>
              </div>
            </div>
          </div>

          {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">相连节点</h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {[...incomingEdges, ...outgoingEdges].slice(0, 10).map((edge) => {
                    const connectedNodeId = edge.source === node.id ? edge.target : edge.source
                    return (
                      <button
                        key={edge.id}
                        onClick={() => onNavigateToEvidence(connectedNodeId)}
                        className="flex w-full items-center justify-between rounded-md border p-2 text-left hover:bg-accent"
                      >
                        <span className="font-mono text-xs">
                          {connectedNodeId.slice(0, 12)}...
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {edge.score.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
