# apps/web

ChainSight frontend SPA for Phase 3.

## Stack

- React + Vite (SPA, no SSR)
- TanStack Router (file-based routes)
- TanStack Query
- GraphQL Code Generator
- viem (wallet connect / sign / send tx)
- react-force-graph-2d
- shadcn-style primitives (black/white default)

## Routes

- `/submit` - submit evidence with wallet signature
- `/evidence/:evidenceId` - evidence detail, IPFS content, analysis, anchor action
- `/graph` - propagation graph view

## Setup

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies: `pnpm install`
3. Generate GraphQL types: `pnpm codegen`
4. Start dev server: `pnpm dev`

If you have a running PostGraphile endpoint, codegen can use it by overriding:

```bash
GRAPHQL_SCHEMA=http://127.0.0.1:5000/graphql pnpm codegen
```
