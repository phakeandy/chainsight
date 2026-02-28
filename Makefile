K8S_NAMESPACE ?= chainsight
DBMATE = dbmate --migrations-dir db/migrations --migrations-table public.schema_migrations

.PHONY: help
help:
	@printf "Targets:\n"
	@printf "  make check.env           Verify required env vars are set\n"
	@printf "  make check.tools         Verify required CLIs are installed\n"
	@printf "  make check.db            Verify DATABASE_URL is reachable\n"
	@printf "  make check.k8s           Verify current kube context is reachable\n"
	@printf "  make check.all           Run all preflight checks\n"
	@printf "  make k8s.render          Render backend manifests from root kustomization\n"
	@printf "  make k8s.apply           Apply backend manifests after preflight\n"
	@printf "  make k8s.delete          Delete backend manifests\n"
	@printf "  make k8s.status          Show resources in namespace\n"
	@printf "  make db.status           Show dbmate migration status\n"
	@printf "  make db.up               Apply dbmate migrations\n"
	@printf "  make db.new NAME=...     Create a new dbmate migration\n"
	@printf "  make worker.run          Run worker locally with current env\n"
	@printf "  make worker.image.load   Build worker image and import to k0s containerd\n"

.PHONY: check.env
check.env:
	@if [ -z "$(DATABASE_URL)" ]; then echo "[FATAL] DATABASE_URL is not set"; echo "        run: direnv allow"; exit 1; fi

.PHONY: check.tools
check.tools:
	@command -v kubectl >/dev/null 2>&1 || { echo "[FATAL] missing dependency: kubectl"; exit 1; }
	@command -v dbmate >/dev/null 2>&1 || { echo "[FATAL] missing dependency: dbmate"; exit 1; }
	@command -v psql >/dev/null 2>&1 || { echo "[FATAL] missing dependency: psql"; exit 1; }

.PHONY: check.db
check.db: check.env check.tools
	@psql '$(DATABASE_URL)' -v ON_ERROR_STOP=1 -c 'select 1;' >/dev/null 2>&1 || { echo "[FATAL] cannot connect to DATABASE_URL=$(DATABASE_URL)"; echo "        reason: PostgreSQL unavailable or credentials invalid"; exit 1; }

.PHONY: check.k8s
check.k8s: check.tools
	@kubectl cluster-info >/dev/null 2>&1 || { echo "[FATAL] cannot reach kubernetes cluster with current kube context"; exit 1; }

.PHONY: check.all
check.all: check.env check.db check.k8s
	@echo "[OK] all preflight checks passed"

.PHONY: k8s.render
k8s.render:
	kubectl kustomize k8s

.PHONY: k8s.apply
k8s.apply: check.db check.k8s
	kubectl apply -k k8s

.PHONY: k8s.delete
k8s.delete: check.k8s
	kubectl delete -k k8s

.PHONY: k8s.status
k8s.status: check.k8s
	kubectl -n '$(K8S_NAMESPACE)' get all

.PHONY: db.status
db.status: check.db
	@$(DBMATE) status

.PHONY: db.up
db.up: check.db
	@$(DBMATE) up

.PHONY: db.new
db.new:
	@if [ -z "$(NAME)" ]; then echo "Usage: make db.new NAME=create_table_xxx"; exit 1; fi
	@$(DBMATE) new $(NAME)

.PHONY: worker.run
worker.run: check.db
	@if [ -z "$(IPFS_API_URL)" ]; then echo "[FATAL] IPFS_API_URL is not set"; echo "        run: direnv allow"; exit 1; fi
	@cd services/worker && DATABASE_URL='$(DATABASE_URL)' IPFS_API_URL='$(IPFS_API_URL)' PG_LISTEN_CHANNEL='$(PG_LISTEN_CHANNEL)' go run ./cmd/worker

.PHONY: worker.image.load
worker.image.load:
	docker buildx build --platform linux/amd64 --output type=oci,dest=- -t chainsight-worker:dev ./services/worker | sudo k0s ctr --namespace k8s.io images import --all-platforms -
