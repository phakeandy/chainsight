# Database (dbmate)

该目录使用 `dbmate` 管理 migration。

## 约定

- migration 文件位于 `db/migrations`
- 不手动维护版本号表，由 dbmate 自动管理
- 每次 schema 变更都通过 dbmate 生成 migration

## 常用命令

```bash
DATABASE_URL='postgres://chainsight:123456789@127.0.0.1:5433/chainsight?sslmode=disable' dbmate --migrations-dir db/migrations up
DATABASE_URL='postgres://chainsight:123456789@127.0.0.1:5433/chainsight?sslmode=disable' dbmate --migrations-dir db/migrations status
DATABASE_URL='postgres://chainsight:123456789@127.0.0.1:5433/chainsight?sslmode=disable' dbmate --migrations-dir db/migrations new add_example_table
```

也可以直接使用仓库根目录 `Makefile`：

```bash
make db.status
make db.up
make db.new NAME=add_example_table
```
