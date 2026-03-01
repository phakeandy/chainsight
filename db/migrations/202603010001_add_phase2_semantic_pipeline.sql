-- migrate:up
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'vector'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS vector;

    ALTER TABLE chainsight.evidence
    ALTER COLUMN embedding TYPE vector(1536)
    USING (
      CASE
        WHEN embedding IS NULL THEN NULL
        ELSE ('[' || array_to_string(embedding, ',') || ']')::vector(1536)
      END
    );

    CREATE INDEX IF NOT EXISTS evidence_embedding_cosine_idx
    ON chainsight.evidence
    USING hnsw (embedding vector_cosine_ops);
  ELSE
    RAISE NOTICE 'pgvector extension not available; keep embedding as real[] and use worker-side cosine fallback';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS evidence_created_at_asc_idx
ON chainsight.evidence (created_at);

-- migrate:down
-- intentionally empty
