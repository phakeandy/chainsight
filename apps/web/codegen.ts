import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA ?? './src/graphql/schema.graphql',
  documents: ['./src/graphql/documents/**/*.graphql'],
  generates: {
    './src/graphql/__generated__/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: {
          UUID: 'string',
          BigInt: 'string',
          Datetime: 'string',
        },
      },
    },
  },
  ignoreNoDocuments: false,
}

export default config
