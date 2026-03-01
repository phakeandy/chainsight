-- migrate:up
CREATE OR REPLACE FUNCTION chainsight.graph_nodes(limit_count integer DEFAULT 200)
RETURNS TABLE (
  id uuid,
  cid text,
  status chainsight.evidence_status,
  ai_label text,
  ai_summary text,
  created_at timestamptz,
  anchored_at timestamptz,
  submitter_address text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.cid,
    e.status,
    e.ai_label,
    e.ai_summary,
    e.created_at,
    e.anchored_at,
    e.submitter_address
  FROM chainsight.evidence AS e
  ORDER BY e.created_at DESC
  LIMIT GREATEST(limit_count, 1);
$$;

CREATE OR REPLACE FUNCTION chainsight.graph_edges(
  limit_count integer DEFAULT 1000,
  min_score double precision DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  source_evidence_id uuid,
  target_evidence_id uuid,
  score double precision,
  edge_type text,
  created_at timestamptz,
  source_cid text,
  target_cid text,
  source_ai_label text,
  target_ai_label text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    se.id,
    se.source_evidence_id,
    se.target_evidence_id,
    se.score,
    se.edge_type,
    se.created_at,
    src.cid AS source_cid,
    dst.cid AS target_cid,
    src.ai_label AS source_ai_label,
    dst.ai_label AS target_ai_label
  FROM chainsight.semantic_edge AS se
  JOIN chainsight.evidence AS src ON src.id = se.source_evidence_id
  JOIN chainsight.evidence AS dst ON dst.id = se.target_evidence_id
  WHERE se.score >= min_score
  ORDER BY se.created_at DESC
  LIMIT GREATEST(limit_count, 1);
$$;

CREATE OR REPLACE FUNCTION chainsight.graph_node_detail(node_id uuid)
RETURNS TABLE (
  id uuid,
  cid text,
  status chainsight.evidence_status,
  ai_label text,
  ai_summary text,
  content text,
  submitter_address text,
  created_at timestamptz,
  anchored_at timestamptz,
  outgoing_semantic_edges bigint,
  incoming_semantic_edges bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.cid,
    e.status,
    e.ai_label,
    e.ai_summary,
    e.content,
    e.submitter_address,
    e.created_at,
    e.anchored_at,
    (
      SELECT count(*)
      FROM chainsight.semantic_edge
      WHERE source_evidence_id = e.id
    ) AS outgoing_semantic_edges,
    (
      SELECT count(*)
      FROM chainsight.semantic_edge
      WHERE target_evidence_id = e.id
    ) AS incoming_semantic_edges
  FROM chainsight.evidence AS e
  WHERE e.id = node_id;
$$;

-- migrate:down
-- intentionally empty
