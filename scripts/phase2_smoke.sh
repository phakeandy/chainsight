#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[FATAL] DATABASE_URL is not set"
  exit 1
fi

MAX_WAIT_SECONDS="${PHASE2_SMOKE_TIMEOUT_SECONDS:-120}"
POLL_INTERVAL_SECONDS=3
SUBMITTER_ADDRESS="0x0000000000000000000000000000000000000001"

psql_exec() {
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -At -c "$1"
}

submit_evidence() {
  local content="$1"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -v content="${content}" -At <<'SQL'
select id
from chainsight.submit_evidence(
  :'content',
  '${SUBMITTER_ADDRESS}',
  'phase2-smoke-signature'
);
SQL
}

wait_until_analyzed() {
  local evidence_id="$1"
  local waited=0

  while [[ "${waited}" -le "${MAX_WAIT_SECONDS}" ]]; do
    local row
    row="$(psql_exec "select status::text, (ai_label is not null)::int, (embedding is not null)::int from chainsight.evidence where id = '${evidence_id}'::uuid;")"

    if [[ -n "${row}" ]]; then
      local status has_label has_embedding
      IFS='|' read -r status has_label has_embedding <<< "${row}"

      if [[ "${status}" == "ANALYZED" || "${status}" == "ANCHORED" ]] && [[ "${has_label}" == "1" ]] && [[ "${has_embedding}" == "1" ]]; then
        echo "[OK] analyzed evidence_id=${evidence_id} status=${status}"
        return 0
      fi

      if [[ "${status}" == "FAILED" ]]; then
        local err
        err="$(psql_exec "select coalesce(error_message, '') from chainsight.processing_job where evidence_id = '${evidence_id}'::uuid order by id desc limit 1;")"
        echo "[FATAL] evidence pipeline failed for ${evidence_id}: ${err}"
        return 1
      fi
    fi

    sleep "${POLL_INTERVAL_SECONDS}"
    waited=$((waited + POLL_INTERVAL_SECONDS))
  done

  echo "[FATAL] timeout waiting analysis for evidence_id=${evidence_id}"
  return 1
}

main() {
  local marker
  marker="$(date +%s)-$$"

  echo "[INFO] Phase2 smoke marker=${marker}"

  local base_text
  base_text="phase2 smoke base rumor marker ${marker}: 某地突发事件已造成大量伤亡，未经证实，请核实来源。"
  local followup_text
  followup_text="phase2 smoke followup rumor marker ${marker}: 某地突发事件已造成大量伤亡，未经证实，请核实来源。"

  local base_id followup_id
  base_id="$(submit_evidence "${base_text}")"
  echo "[INFO] submitted base evidence_id=${base_id}"
  wait_until_analyzed "${base_id}"

  followup_id="$(submit_evidence "${followup_text}")"
  echo "[INFO] submitted followup evidence_id=${followup_id}"
  wait_until_analyzed "${followup_id}"

  local edge_count
  edge_count="$(psql_exec "select count(*) from chainsight.semantic_edge where source_evidence_id = '${followup_id}'::uuid and target_evidence_id = '${base_id}'::uuid and edge_type = 'semantic';")"
  if [[ "${edge_count}" == "0" ]]; then
    echo "[FATAL] semantic edge not created: source=${followup_id} target=${base_id}"
    exit 1
  fi

  local summary
  summary="$(psql_exec "select coalesce(ai_label, '') || ' | ' || coalesce(ai_summary, '') from chainsight.evidence where id = '${followup_id}'::uuid;")"

  echo "[OK] semantic edge created count=${edge_count}"
  echo "[OK] followup analysis=${summary}"
  echo "[DONE] Phase2 smoke passed"
}

main "$@"
