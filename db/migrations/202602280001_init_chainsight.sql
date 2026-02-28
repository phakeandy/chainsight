-- migrate:up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS chainsight;

CREATE TYPE chainsight.evidence_status AS ENUM (
  'PENDING_UPLOAD',
  'CID_READY',
  'ANCHORED',
  'ANALYZED',
  'FAILED'
);

CREATE TABLE chainsight.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  submitter_address text NOT NULL,
  submitter_signature text NOT NULL,
  cid text UNIQUE,
  status chainsight.evidence_status NOT NULL DEFAULT 'PENDING_UPLOAD',
  ai_label text,
  ai_summary text,
  embedding real[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  anchored_at timestamptz
);

CREATE INDEX evidence_created_at_idx ON chainsight.evidence (created_at DESC);
CREATE INDEX evidence_status_idx ON chainsight.evidence (status);

CREATE TABLE chainsight.anchor_tx (
  id bigserial PRIMARY KEY,
  evidence_id uuid NOT NULL REFERENCES chainsight.evidence (id) ON DELETE CASCADE,
  chain_id bigint NOT NULL,
  contract_address text NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  onchain_evidence_id bigint,
  sender_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE INDEX anchor_tx_evidence_id_idx ON chainsight.anchor_tx (evidence_id);

CREATE TABLE chainsight.semantic_edge (
  id bigserial PRIMARY KEY,
  source_evidence_id uuid NOT NULL REFERENCES chainsight.evidence (id) ON DELETE CASCADE,
  target_evidence_id uuid NOT NULL REFERENCES chainsight.evidence (id) ON DELETE CASCADE,
  score double precision NOT NULL,
  edge_type text NOT NULL DEFAULT 'semantic',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_evidence_id, target_evidence_id, edge_type)
);

CREATE INDEX semantic_edge_source_idx ON chainsight.semantic_edge (source_evidence_id);
CREATE INDEX semantic_edge_target_idx ON chainsight.semantic_edge (target_evidence_id);

CREATE TABLE chainsight.processing_job (
  id bigserial PRIMARY KEY,
  evidence_id uuid NOT NULL REFERENCES chainsight.evidence (id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX processing_job_evidence_id_idx ON chainsight.processing_job (evidence_id);
CREATE INDEX processing_job_status_idx ON chainsight.processing_job (status);

CREATE TABLE chainsight.append_only_hash_log (
  id bigserial PRIMARY KEY,
  evidence_id uuid NOT NULL REFERENCES chainsight.evidence (id) ON DELETE CASCADE,
  payload_hash text NOT NULL,
  previous_hash text,
  current_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX append_only_hash_log_evidence_id_idx ON chainsight.append_only_hash_log (evidence_id);

CREATE OR REPLACE FUNCTION chainsight.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_touch_updated_at
BEFORE UPDATE ON chainsight.evidence
FOR EACH ROW
EXECUTE FUNCTION chainsight.touch_updated_at();

CREATE TRIGGER processing_job_touch_updated_at
BEFORE UPDATE ON chainsight.processing_job
FOR EACH ROW
EXECUTE FUNCTION chainsight.touch_updated_at();

CREATE OR REPLACE FUNCTION chainsight.notify_evidence_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify(
    'chainsight_evidence_created',
    json_build_object(
      'event', 'evidence_created',
      'evidence_id', NEW.id,
      'created_at', NEW.created_at
    )::text
  );

  INSERT INTO chainsight.processing_job (evidence_id, job_type)
  VALUES (NEW.id, 'evidence_pipeline');

  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_created_notify
AFTER INSERT ON chainsight.evidence
FOR EACH ROW
EXECUTE FUNCTION chainsight.notify_evidence_created();

-- migrate:down
-- intentionally empty
