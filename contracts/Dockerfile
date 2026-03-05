FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json hardhat.config.js ./
COPY contracts ./contracts
COPY ignition ./ignition
COPY scripts ./scripts
COPY test ./test

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm hardhat compile

EXPOSE 8545

CMD ["pnpm", "hardhat", "node", "--hostname", "0.0.0.0", "--port", "8545"]
