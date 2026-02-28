# services/worker

Go Worker 服务。

当前实现（Phase 1）：

- 监听 PostgreSQL `LISTEN/NOTIFY` 频道 `chainsight_evidence_created`
- 拉取 `chainsight.evidence` 内容并上传到 IPFS
- 回填 `cid` 与 `status = CID_READY`
- 记录 `append_only_hash_log`
- 同步更新 `processing_job` 状态

运行时必须设置以下环境变量：

- `DATABASE_URL`
- `IPFS_API_URL`
- `PG_LISTEN_CHANNEL`（可选，默认 `chainsight_evidence_created`）

启动时会做依赖预检查（PostgreSQL、IPFS API）；失败会直接退出并打印原因。

## Phase 1 本地冒烟

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
select id, cid, status from chainsight.evidence order by created_at desc limit 1;
select evidence_id, status, attempts, error_message from chainsight.processing_job order by id desc limit 1;
```

期望：`evidence.cid` 被回填，`evidence.status = CID_READY`，`processing_job.status = completed`。
