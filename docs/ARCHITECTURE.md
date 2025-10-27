# 项目架构

```text
.
├── README.md
├── api
├── contracts
├── docs
└── ui
```

- Api 模块：提供 HTTP 接口，接收用户请求，调用链上合约，调用 LLM API，返回结果
  - 技术栈：FastAPI、SQLAlchemy Core
- Contracts 模块：定义智能合约，实现业务逻辑
  - 技术栈：Hardhat、Viem
- UI 模块：提供用户界面
  - 技术栈：Vue3、Viem
