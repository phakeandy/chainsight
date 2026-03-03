import {
  GraphEdgesDocument,
  GraphNodeDetailDocument,
  GraphNodesDocument,
  RecordAnchorTxDocument,
  SubmitEvidenceDocument,
  type GraphEdgesQuery,
  type GraphEdgesQueryVariables,
  type GraphNodeDetailQuery,
  type GraphNodeDetailQueryVariables,
  type GraphNodesQuery,
  type GraphNodesQueryVariables,
  type RecordAnchorTxMutation,
  type RecordAnchorTxMutationVariables,
  type SubmitEvidenceMutation,
  type SubmitEvidenceMutationVariables,
} from '../../graphql/__generated__/operations'
import { requestGraphql } from './client'

function requireData<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new Error(message)
  }
  return value
}

export async function submitEvidence(variables: SubmitEvidenceMutationVariables) {
  const data = await requestGraphql<SubmitEvidenceMutation, SubmitEvidenceMutationVariables>(SubmitEvidenceDocument, variables)
  return requireData(data.submitEvidence?.evidence, 'submitEvidence 未返回 evidence payload')
}

export async function recordAnchorTx(variables: RecordAnchorTxMutationVariables) {
  const data = await requestGraphql<RecordAnchorTxMutation, RecordAnchorTxMutationVariables>(RecordAnchorTxDocument, variables)
  return requireData(data.recordAnchorTx?.anchorTx, 'recordAnchorTx 未返回 anchorTx payload')
}

export async function fetchGraphNodes(variables: GraphNodesQueryVariables) {
  const data = await requestGraphql<GraphNodesQuery, GraphNodesQueryVariables>(GraphNodesDocument, variables)
  const nodes = data.graphNodes?.nodes ?? []
  return nodes.filter((node): node is NonNullable<(typeof nodes)[number]> => node != null)
}

export async function fetchGraphEdges(variables: GraphEdgesQueryVariables) {
  const data = await requestGraphql<GraphEdgesQuery, GraphEdgesQueryVariables>(GraphEdgesDocument, variables)
  const nodes = data.graphEdges?.nodes ?? []
  return nodes.filter((node): node is NonNullable<(typeof nodes)[number]> => node != null)
}

export async function fetchGraphNodeDetail(variables: GraphNodeDetailQueryVariables) {
  const data = await requestGraphql<GraphNodeDetailQuery, GraphNodeDetailQueryVariables>(GraphNodeDetailDocument, variables)
  return data.graphNodeDetail?.nodes?.find((node) => node != null) ?? null
}
