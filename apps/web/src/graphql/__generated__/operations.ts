import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: string; output: string; }
  Cursor: { input: any; output: any; }
  Datetime: { input: string; output: string; }
  UUID: { input: string; output: string; }
};

export type AnchorTx = {
  __typename?: 'AnchorTx';
  chainId: Scalars['BigInt']['output'];
  confirmedAt?: Maybe<Scalars['Datetime']['output']>;
  contractAddress: Scalars['String']['output'];
  createdAt: Scalars['Datetime']['output'];
  evidenceId: Scalars['UUID']['output'];
  id: Scalars['BigInt']['output'];
  onchainEvidenceId?: Maybe<Scalars['BigInt']['output']>;
  senderAddress: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
};

export type Evidence = {
  __typename?: 'Evidence';
  aiLabel?: Maybe<Scalars['String']['output']>;
  aiSummary?: Maybe<Scalars['String']['output']>;
  anchoredAt?: Maybe<Scalars['Datetime']['output']>;
  cid?: Maybe<Scalars['String']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  status: EvidenceStatus;
  submitterAddress: Scalars['String']['output'];
  submitterSignature: Scalars['String']['output'];
};

export type EvidenceStatus =
  | 'ANALYZED'
  | 'ANCHORED'
  | 'CID_READY'
  | 'FAILED'
  | 'PENDING_UPLOAD';

export type GraphEdge = {
  __typename?: 'GraphEdge';
  createdAt: Scalars['Datetime']['output'];
  edgeType: Scalars['String']['output'];
  id: Scalars['BigInt']['output'];
  score: Scalars['Float']['output'];
  sourceAiLabel?: Maybe<Scalars['String']['output']>;
  sourceCid?: Maybe<Scalars['String']['output']>;
  sourceEvidenceId: Scalars['UUID']['output'];
  targetAiLabel?: Maybe<Scalars['String']['output']>;
  targetCid?: Maybe<Scalars['String']['output']>;
  targetEvidenceId: Scalars['UUID']['output'];
};

export type GraphEdgesConnection = {
  __typename?: 'GraphEdgesConnection';
  nodes: Array<Maybe<GraphEdge>>;
};

export type GraphNode = {
  __typename?: 'GraphNode';
  aiLabel?: Maybe<Scalars['String']['output']>;
  aiSummary?: Maybe<Scalars['String']['output']>;
  anchoredAt?: Maybe<Scalars['Datetime']['output']>;
  cid?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  status: EvidenceStatus;
  submitterAddress: Scalars['String']['output'];
};

export type GraphNodeDetail = {
  __typename?: 'GraphNodeDetail';
  aiLabel?: Maybe<Scalars['String']['output']>;
  aiSummary?: Maybe<Scalars['String']['output']>;
  anchoredAt?: Maybe<Scalars['Datetime']['output']>;
  cid?: Maybe<Scalars['String']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  incomingSemanticEdges: Scalars['BigInt']['output'];
  outgoingSemanticEdges: Scalars['BigInt']['output'];
  status: EvidenceStatus;
  submitterAddress: Scalars['String']['output'];
};

export type GraphNodeDetailConnection = {
  __typename?: 'GraphNodeDetailConnection';
  nodes: Array<Maybe<GraphNodeDetail>>;
};

export type GraphNodesConnection = {
  __typename?: 'GraphNodesConnection';
  nodes: Array<Maybe<GraphNode>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  recordAnchorTx?: Maybe<RecordAnchorTxPayload>;
  submitEvidence?: Maybe<SubmitEvidencePayload>;
};


export type MutationRecordAnchorTxArgs = {
  input: RecordAnchorTxInput;
};


export type MutationSubmitEvidenceArgs = {
  input: SubmitEvidenceInput;
};

export type Query = {
  __typename?: 'Query';
  graphEdges?: Maybe<GraphEdgesConnection>;
  graphNodeDetail?: Maybe<GraphNodeDetailConnection>;
  graphNodes?: Maybe<GraphNodesConnection>;
};


export type QueryGraphEdgesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
  minScore?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGraphNodeDetailArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  nodeId?: InputMaybe<Scalars['UUID']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGraphNodesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type RecordAnchorTxInput = {
  chainId: Scalars['BigInt']['input'];
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  contractAddress: Scalars['String']['input'];
  evidenceId: Scalars['UUID']['input'];
  onchainEvidenceId?: InputMaybe<Scalars['BigInt']['input']>;
  senderAddress: Scalars['String']['input'];
  txHash: Scalars['String']['input'];
};

export type RecordAnchorTxPayload = {
  __typename?: 'RecordAnchorTxPayload';
  anchorTx?: Maybe<AnchorTx>;
  clientMutationId?: Maybe<Scalars['String']['output']>;
};

export type SubmitEvidenceInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  content: Scalars['String']['input'];
  submitterAddress: Scalars['String']['input'];
  submitterSignature: Scalars['String']['input'];
};

export type SubmitEvidencePayload = {
  __typename?: 'SubmitEvidencePayload';
  clientMutationId?: Maybe<Scalars['String']['output']>;
  evidence?: Maybe<Evidence>;
};

export type GraphEdgesQueryVariables = Exact<{
  limitCount?: InputMaybe<Scalars['Int']['input']>;
  minScore?: InputMaybe<Scalars['Float']['input']>;
}>;


export type GraphEdgesQuery = { __typename?: 'Query', graphEdges?: { __typename?: 'GraphEdgesConnection', nodes: Array<{ __typename?: 'GraphEdge', id: string, sourceEvidenceId: string, targetEvidenceId: string, score: number, edgeType: string, createdAt: string, sourceCid?: string | null, targetCid?: string | null, sourceAiLabel?: string | null, targetAiLabel?: string | null } | null> } | null };

export type GraphNodeDetailQueryVariables = Exact<{
  nodeId: Scalars['UUID']['input'];
}>;


export type GraphNodeDetailQuery = { __typename?: 'Query', graphNodeDetail?: { __typename?: 'GraphNodeDetailConnection', nodes: Array<{ __typename?: 'GraphNodeDetail', id: string, cid?: string | null, status: EvidenceStatus, aiLabel?: string | null, aiSummary?: string | null, content: string, submitterAddress: string, createdAt: string, anchoredAt?: string | null, outgoingSemanticEdges: string, incomingSemanticEdges: string } | null> } | null };

export type GraphNodesQueryVariables = Exact<{
  limitCount?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GraphNodesQuery = { __typename?: 'Query', graphNodes?: { __typename?: 'GraphNodesConnection', nodes: Array<{ __typename?: 'GraphNode', id: string, cid?: string | null, status: EvidenceStatus, aiLabel?: string | null, aiSummary?: string | null, submitterAddress: string, createdAt: string, anchoredAt?: string | null } | null> } | null };

export type RecordAnchorTxMutationVariables = Exact<{
  evidenceId: Scalars['UUID']['input'];
  chainId: Scalars['BigInt']['input'];
  contractAddress: Scalars['String']['input'];
  txHash: Scalars['String']['input'];
  senderAddress: Scalars['String']['input'];
  onchainEvidenceId?: InputMaybe<Scalars['BigInt']['input']>;
}>;


export type RecordAnchorTxMutation = { __typename?: 'Mutation', recordAnchorTx?: { __typename?: 'RecordAnchorTxPayload', anchorTx?: { __typename?: 'AnchorTx', id: string, evidenceId: string, txHash: string, chainId: string, senderAddress: string, onchainEvidenceId?: string | null, contractAddress: string, confirmedAt?: string | null } | null } | null };

export type SubmitEvidenceMutationVariables = Exact<{
  content: Scalars['String']['input'];
  submitterAddress: Scalars['String']['input'];
  submitterSignature: Scalars['String']['input'];
}>;


export type SubmitEvidenceMutation = { __typename?: 'Mutation', submitEvidence?: { __typename?: 'SubmitEvidencePayload', evidence?: { __typename?: 'Evidence', id: string, cid?: string | null, status: EvidenceStatus, submitterAddress: string, submitterSignature: string, content: string, aiLabel?: string | null, aiSummary?: string | null, createdAt: string, anchoredAt?: string | null } | null } | null };


export const GraphEdgesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GraphEdges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"1000"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"minScore"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"graphEdges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limitCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}},{"kind":"Argument","name":{"kind":"Name","value":"minScore"},"value":{"kind":"Variable","name":{"kind":"Name","value":"minScore"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sourceEvidenceId"}},{"kind":"Field","name":{"kind":"Name","value":"targetEvidenceId"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"edgeType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourceCid"}},{"kind":"Field","name":{"kind":"Name","value":"targetCid"}},{"kind":"Field","name":{"kind":"Name","value":"sourceAiLabel"}},{"kind":"Field","name":{"kind":"Name","value":"targetAiLabel"}}]}}]}}]}}]} as unknown as DocumentNode<GraphEdgesQuery, GraphEdgesQueryVariables>;
export const GraphNodeDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GraphNodeDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"graphNodeDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"nodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"aiLabel"}},{"kind":"Field","name":{"kind":"Name","value":"aiSummary"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"submitterAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"anchoredAt"}},{"kind":"Field","name":{"kind":"Name","value":"outgoingSemanticEdges"}},{"kind":"Field","name":{"kind":"Name","value":"incomingSemanticEdges"}}]}}]}}]}}]} as unknown as DocumentNode<GraphNodeDetailQuery, GraphNodeDetailQueryVariables>;
export const GraphNodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GraphNodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"200"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"graphNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limitCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"aiLabel"}},{"kind":"Field","name":{"kind":"Name","value":"aiSummary"}},{"kind":"Field","name":{"kind":"Name","value":"submitterAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"anchoredAt"}}]}}]}}]}}]} as unknown as DocumentNode<GraphNodesQuery, GraphNodesQueryVariables>;
export const RecordAnchorTxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordAnchorTx"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"evidenceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chainId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contractAddress"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"txHash"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"senderAddress"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"onchainEvidenceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordAnchorTx"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"evidenceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"evidenceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"chainId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chainId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"contractAddress"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contractAddress"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"txHash"},"value":{"kind":"Variable","name":{"kind":"Name","value":"txHash"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"senderAddress"},"value":{"kind":"Variable","name":{"kind":"Name","value":"senderAddress"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"onchainEvidenceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"onchainEvidenceId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"anchorTx"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"evidenceId"}},{"kind":"Field","name":{"kind":"Name","value":"txHash"}},{"kind":"Field","name":{"kind":"Name","value":"chainId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAddress"}},{"kind":"Field","name":{"kind":"Name","value":"onchainEvidenceId"}},{"kind":"Field","name":{"kind":"Name","value":"contractAddress"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedAt"}}]}}]}}]}}]} as unknown as DocumentNode<RecordAnchorTxMutation, RecordAnchorTxMutationVariables>;
export const SubmitEvidenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitEvidence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"submitterAddress"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"submitterSignature"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitEvidence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"submitterAddress"},"value":{"kind":"Variable","name":{"kind":"Name","value":"submitterAddress"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"submitterSignature"},"value":{"kind":"Variable","name":{"kind":"Name","value":"submitterSignature"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evidence"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submitterAddress"}},{"kind":"Field","name":{"kind":"Name","value":"submitterSignature"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"aiLabel"}},{"kind":"Field","name":{"kind":"Name","value":"aiSummary"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"anchoredAt"}}]}}]}}]}}]} as unknown as DocumentNode<SubmitEvidenceMutation, SubmitEvidenceMutationVariables>;