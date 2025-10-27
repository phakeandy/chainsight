# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 项目特定信息

- **包管理器**: 使用 `pnpm` (在 contracts/package.json 中指定)
- **Git 提交**: 必须使用中文描述，遵循 Angular Commit 规范
- **智能合约**: 使用 Hardhat + Viem，支持 EDR 模拟网络 (hardhatMainnet, hardhatOp)
- **网络配置**: 需要 SEPOLIA_RPC_URL 和 SEPOLIA_PRIVATE_KEY 环境变量用于 Sepolia 网络

## 开发命令

- **合约测试**: `cd contracts && pnpm hardhat test`
- **合约编译**: `cd contracts && pnpm hardhat compile`
- **部署合约**: `cd contracts && pnpm hardhat ignition deploy`

## 代码规范

- 所有模块必须从各自目录运行命令，不能从根目录运行
- 合约使用 Solidity 0.8.28，生产环境启用优化器
- 项目架构：API (FastAPI + SQLAlchemy Core) + Contracts (Hardhat + Viem) + UI (Vue3 + Viem)
