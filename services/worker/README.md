# services/worker

Go Worker 服务。

当前实现（Phase 2）：

- 监听 PostgreSQL `LISTEN/NOTIFY` 频道 `chainsight_evidence_created`
- 拉取 `chainsight.evidence` 内容并上传到 IPFS
- 回填 `cid` 与 `status = CID_READY`
- 记录 `append_only_hash_log`
- 调用 OpenRouter 分类并写入 `ai_label` + `ai_summary`
- 调用 OpenRouter 生成 embedding 并回填 `embedding`
- 基于 pgvector 检索历史相似证据并写入 `semantic_edge`
- 同步更新 `processing_job` 状态

运行时必须设置以下环境变量：

- `DATABASE_URL`
- `IPFS_API_URL`
- `PG_LISTEN_CHANNEL`（可选，默认 `chainsight_evidence_created`）
- `OPENROUTER_APIKEY`
- `OPENROUTER_BASE_URL`（可选，默认 `https://openrouter.ai/api/v1`）
- `OPENROUTER_CHAT_MODEL`（可选，默认 `openai/gpt-4o-mini`）
- `OPENROUTER_EMBED_MODEL`（可选，默认 `openai/text-embedding-3-small`）
- `EMBEDDING_DIM`（可选，默认 `1536`）
- `SIMILARITY_TOP_K`（可选，默认 `5`）
- `SIMILARITY_THRESHOLD`（可选，默认 `0.82`）

启动时会做依赖预检查（PostgreSQL、IPFS API）；失败会直接退出并打印原因。

## Phase 2 本地冒烟

1. 执行迁移：`make db.up`
2. 部署基础资源：`make k8s.apply`
3. 向数据库插入一条待处理证据：

```sql
insert into chainsight.evidence (content, submitter_address, submitter_signature)
values ('phase1 smoke evidence', '0x0000000000000000000000000000000000000001', 'demo-signature')
returning id;
```

4. 检查处理结果：

```sql
select id, cid, status, ai_label from chainsight.evidence order by created_at desc limit 1;
select id, source_evidence_id, target_evidence_id, score from chainsight.semantic_edge order by id desc limit 5;
select evidence_id, status, attempts, error_message from chainsight.processing_job order by id desc limit 1;
```

期望：`evidence.cid`、`ai_label`、`embedding` 被回填，且自动写入 `semantic_edge`，`processing_job.status = completed`。

说明：若当前 PostgreSQL 未安装 pgvector 扩展，worker 会自动退回到 Go 侧 cosine 计算路径，功能可用但检索性能较弱。

也可以在仓库根目录直接运行：`make phase2.smoke`。
