import { Layers } from 'lucide-react'

interface MinimapProps {
  graphRef: React.RefObject<{ zoomToFit: (duration?: number, padding?: number) => void } | null>
}

export function Minimap({ graphRef }: MinimapProps) {
  const handleCenterView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={handleCenterView}
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-md hover:bg-accent"
      >
        <Layers className="h-4 w-4" />
        <span>适应屏幕</span>
      </button>
    </div>
  )
}
