import { ClientError, GraphQLClient } from 'graphql-request'
import type { RequestDocument } from 'graphql-request'

import { env } from '../env'

const client = new GraphQLClient(env.graphqlUrl)

export async function requestGraphql<TData, TVariables extends object>(document: RequestDocument, variables: TVariables): Promise<TData> {
  try {
    const unsafeClient = client as unknown as {
      request: (requestDocument: RequestDocument, requestVariables?: object) => Promise<TData>
    }
    return await unsafeClient.request(document, variables)
  } catch (error) {
    if (error instanceof ClientError) {
      const firstMessage = error.response.errors?.[0]?.message
      throw new Error(firstMessage ?? `GraphQL 请求失败，状态码 ${error.response.status}`)
    }
    throw error
  }
}
