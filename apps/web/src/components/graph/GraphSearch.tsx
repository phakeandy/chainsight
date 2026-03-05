import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'

interface GraphSearchProps {
  nodes: Array<{ id: string; cid: string | null; aiLabel: string | null; aiSummary: string | null }>
  onSelectNode: (nodeId: string) => void
}

export function GraphSearch({ nodes, onSelectNode }: GraphSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return nodes
      .filter(
        (node) =>
          node.id.toLowerCase().includes(q) ||
          node.cid?.toLowerCase().includes(q) ||
          node.aiLabel?.toLowerCase().includes(q) ||
          node.aiSummary?.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [nodes, query])

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜索节点 ID、CID、AI 标签或正文..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-72 pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-lg">
          {suggestions.map((node) => (
            <button
              key={node.id}
              onClick={() => handleSelect(node.id)}
              className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-xs">{node.id.slice(0, 20)}...</span>
                {node.aiLabel && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {node.aiLabel}
                  </span>
                )}
              </div>
              {node.aiSummary && (
                <span className="line-clamp-1 w-full text-xs text-muted-foreground">
                  {node.aiSummary}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && query && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-lg">
          未找到匹配的节点
        </div>
      )}
    </div>
  )
}
