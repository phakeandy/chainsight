export const queryKeys = {
  graphNodes: (limitCount: number) => ['graphNodes', limitCount] as const,
  graphEdges: (limitCount: number, minScore: number) => ['graphEdges', limitCount, minScore] as const,
  graphNodeDetail: (nodeId: string) => ['graphNodeDetail', nodeId] as const,
} as const
