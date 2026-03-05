import { useState } from 'react'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'

interface GraphControlsProps {
  limitCount: number
  minScore: number
  statusFilter: string
  aiLabelFilter: string
  uniqueStatuses: string[]
  uniqueAiLabels: string[]
  onLimitChange: (value: number) => void
  onMinScoreChange: (value: number) => void
  onStatusFilterChange: (value: string) => void
  onAiLabelFilterChange: (value: string) => void
  onFitToScreen: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  nodeCount: number
  edgeCount: number
}

export function GraphControls({
  limitCount,
  minScore,
  statusFilter,
  aiLabelFilter,
  uniqueStatuses,
  uniqueAiLabels,
  onLimitChange,
  onMinScoreChange,
  onStatusFilterChange,
  onAiLabelFilterChange,
  onFitToScreen,
  onZoomIn,
  onZoomOut,
  nodeCount,
  edgeCount,
}: GraphControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed left-0 top-1/2 z-40 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 bg-background shadow-md transition-all hover:bg-accent ${
          isCollapsed ? 'left-0' : 'left-64'
        }`}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div
        className={`fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-64 transform border-r bg-background transition-transform duration-200 ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            <h2 className="text-lg font-semibold">图谱控制</h2>
          </div>

          <div className="mb-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">节点数量</span>
              <span className="font-medium">{nodeCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">边数量</span>
              <span className="font-medium">{edgeCount}</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit-count">节点上限</Label>
              <Input
                id="limit-count"
                type="number"
                min={1}
                max={1000}
                value={limitCount}
                onChange={(e) => onLimitChange(Number(e.target.value) || 200)}
              />
              <input
                type="range"
                min={10}
                max={500}
                value={limitCount}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="w-full"
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
                onChange={(e) => onMinScoreChange(Number(e.target.value) || 0)}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={minScore}
                onChange={(e) => onMinScoreChange(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>状态筛选</Label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">全部状态</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>AI 标签筛选</Label>
              <select
                value={aiLabelFilter}
                onChange={(e) => onAiLabelFilterChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">全部标签</option>
                {uniqueAiLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>视图控制</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onZoomIn} className="flex-1">
                  放大
                </Button>
                <Button variant="outline" size="sm" onClick={onZoomOut} className="flex-1">
                  缩小
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={onFitToScreen} className="w-full">
                适应屏幕
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>图例</Label>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#97c2fc]" />
                  <span>Semantic 边</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 border-b-2 border-dashed border-muted-foreground" />
                  <span>其他边类型</span>
                </div>
                <p className="text-muted-foreground">
                  边的粗细表示相似度分数
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
