# Chainsight 智能合约项目

本项目是 Chainsight 去中心化信息溯源平台的智能合约部分，使用 Hardhat 3 Beta 开发，包含 `node:test` 测试框架和 `viem` 库用于以太坊交互。

## 项目概述

本项目包含以下智能合约：

### EvidenceAnchor 合约
- **功能**: 去中心化证据锚定
- **描述**: 极简版本的证据锚定合约，只负责在区块链上记录证据的核心信息（IPFS CID、提交者地址、时间戳）
- **特点**:
  - 任何人都可以提交证据
  - 防止重复CID提交
  - 提供完整的查询功能
  - AI分析结果和语义关联存储在链下数据库


## 技术栈

- Hardhat 3 Beta 开发框架
- Solidity 0.8.28
- TypeScript 集成测试
- `node:test` 原生测试运行器
- `viem` 以太坊交互库
- OpenZeppelin 合约库

## 使用方法

### 运行测试

运行项目中的所有测试：

```shell
pnpm hardhat test
```

运行特定合约的测试：

```shell
pnpm hardhat test test/EvidenceAnchor.ts
pnpm hardhat test test/Counter.ts
```

### 编译合约

编译所有智能合约：

```shell
pnpm hardhat compile
```

### 部署合约

#### 部署到本地模拟网络

部署 EvidenceAnchor 合约到 hardhatMainnet 网络：

```shell
pnpm hardhat ignition deploy ./ignition/modules/EvidenceAnchor.ts --network hardhatMainnet
```


#### 部署到 Sepolia 测试网

部署到 Sepolia 测试网需要配置环境变量：

1. 设置 Sepolia RPC URL 和私钥：

```shell
# 使用 hardhat-keystore 设置私钥
pnpm hardhat keystore set SEPOLIA_PRIVATE_KEY

# 或者设置环境变量
export SEPOLIA_RPC_URL="你的 Sepolia RPC URL"
export SEPOLIA_PRIVATE_KEY="你的私钥"
```

2. 部署到 Sepolia：

```shell
pnpm hardhat ignition deploy ./ignition/modules/EvidenceAnchor.ts --network sepolia
```

## 合约说明

### EvidenceAnchor 合约

#### 核心功能

- `anchorEvidence(string _ipfsCid)`: 锚定证据，返回证据ID
- `getEvidenceIdByCid(string _ipfsCid)`: 根据IPFS CID获取证据ID
- `getEvidence(uint256 _evidenceId)`: 获取证据详情
- `getEvidenceCount()`: 获取证据总数

#### 事件

- `EvidenceAnchored(uint256 evidenceId, string ipfsCid, address submitter, uint256 timestamp)`: 证据锚定事件

#### 设计理念

EvidenceAnchor 合约采用极简设计，只负责在区块链上记录最核心、不可变的证据信息：
- IPFS 内容哈希 (CID)
- 提交者地址
- 时间戳

AI分析结果、语义关联等可变数据存储在链下数据库，确保区块链只承担其最擅长的不可变记录功能。
