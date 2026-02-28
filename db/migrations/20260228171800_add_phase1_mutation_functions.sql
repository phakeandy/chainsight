-- migrate:up
CREATE OR REPLACE FUNCTION chainsight.submit_evidence(
  content text,
  submitter_address text,
  submitter_signature text
)
RETURNS chainsight.evidence
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_row chainsight.evidence;
BEGIN
  IF content IS NULL OR btrim(content) = '' THEN
    RAISE EXCEPTION 'content cannot be empty';
  END IF;

  IF submitter_address IS NULL OR btrim(submitter_address) = '' THEN
    RAISE EXCEPTION 'submitter_address cannot be empty';
  END IF;

  IF submitter_signature IS NULL OR btrim(submitter_signature) = '' THEN
    RAISE EXCEPTION 'submitter_signature cannot be empty';
  END IF;

  INSERT INTO chainsight.evidence (content, submitter_address, submitter_signature)
  VALUES (content, submitter_address, submitter_signature)
  RETURNING * INTO inserted_row;

  RETURN inserted_row;
END;
$$;

CREATE OR REPLACE FUNCTION chainsight.record_anchor_tx(
  evidence_id uuid,
  chain_id bigint,
  contract_address text,
  tx_hash text,
  sender_address text,
  onchain_evidence_id bigint DEFAULT NULL
)
RETURNS chainsight.anchor_tx
LANGUAGE plpgsql
AS $$
DECLARE
  evidence_row chainsight.evidence;
  inserted_row chainsight.anchor_tx;
BEGIN
  SELECT * INTO evidence_row
  FROM chainsight.evidence
  WHERE id = evidence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'evidence not found: %', evidence_id;
  END IF;

  IF evidence_row.cid IS NULL THEN
    RAISE EXCEPTION 'evidence cid is not ready: %', evidence_id;
  END IF;

  INSERT INTO chainsight.anchor_tx (
    evidence_id,
    chain_id,
    contract_address,
    tx_hash,
    sender_address,
    onchain_evidence_id,
    confirmed_at
  )
  VALUES (
    evidence_id,
    chain_id,
    contract_address,
    tx_hash,
    sender_address,
    onchain_evidence_id,
    now()
  )
  RETURNING * INTO inserted_row;

  UPDATE chainsight.evidence
  SET status = 'ANCHORED', anchored_at = now(), updated_at = now()
  WHERE id = evidence_id;

  RETURN inserted_row;
END;
$$;


-- migrate:down
-- intentionally empty
