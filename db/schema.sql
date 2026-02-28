\restrict dbmate

-- Dumped from database version 18.2 (Debian 18.2-1.pgdg13+1)
-- Dumped by pg_dump version 18.2 (Debian 18.2-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: chainsight; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA chainsight;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: evidence_status; Type: TYPE; Schema: chainsight; Owner: -
--

CREATE TYPE chainsight.evidence_status AS ENUM (
    'PENDING_UPLOAD',
    'CID_READY',
    'ANCHORED',
    'ANALYZED',
    'FAILED'
);


--
-- Name: notify_evidence_created(); Type: FUNCTION; Schema: chainsight; Owner: -
--

CREATE FUNCTION chainsight.notify_evidence_created() RETURNS trigger
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


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: chainsight; Owner: -
--

CREATE FUNCTION chainsight.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anchor_tx; Type: TABLE; Schema: chainsight; Owner: -
--

CREATE TABLE chainsight.anchor_tx (
    id bigint NOT NULL,
    evidence_id uuid NOT NULL,
    chain_id bigint NOT NULL,
    contract_address text NOT NULL,
    tx_hash text NOT NULL,
    onchain_evidence_id bigint,
    sender_address text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);


--
-- Name: anchor_tx_id_seq; Type: SEQUENCE; Schema: chainsight; Owner: -
--

CREATE SEQUENCE chainsight.anchor_tx_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anchor_tx_id_seq; Type: SEQUENCE OWNED BY; Schema: chainsight; Owner: -
--

ALTER SEQUENCE chainsight.anchor_tx_id_seq OWNED BY chainsight.anchor_tx.id;


--
-- Name: append_only_hash_log; Type: TABLE; Schema: chainsight; Owner: -
--

CREATE TABLE chainsight.append_only_hash_log (
    id bigint NOT NULL,
    evidence_id uuid NOT NULL,
    payload_hash text NOT NULL,
    previous_hash text,
    current_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: append_only_hash_log_id_seq; Type: SEQUENCE; Schema: chainsight; Owner: -
--

CREATE SEQUENCE chainsight.append_only_hash_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: append_only_hash_log_id_seq; Type: SEQUENCE OWNED BY; Schema: chainsight; Owner: -
--

ALTER SEQUENCE chainsight.append_only_hash_log_id_seq OWNED BY chainsight.append_only_hash_log.id;


--
-- Name: evidence; Type: TABLE; Schema: chainsight; Owner: -
--

CREATE TABLE chainsight.evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    submitter_address text NOT NULL,
    submitter_signature text NOT NULL,
    cid text,
    status chainsight.evidence_status DEFAULT 'PENDING_UPLOAD'::chainsight.evidence_status NOT NULL,
    ai_label text,
    ai_summary text,
    embedding real[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    anchored_at timestamp with time zone
);


--
-- Name: processing_job; Type: TABLE; Schema: chainsight; Owner: -
--

CREATE TABLE chainsight.processing_job (
    id bigint NOT NULL,
    evidence_id uuid NOT NULL,
    job_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone
);


--
-- Name: processing_job_id_seq; Type: SEQUENCE; Schema: chainsight; Owner: -
--

CREATE SEQUENCE chainsight.processing_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processing_job_id_seq; Type: SEQUENCE OWNED BY; Schema: chainsight; Owner: -
--

ALTER SEQUENCE chainsight.processing_job_id_seq OWNED BY chainsight.processing_job.id;


--
-- Name: semantic_edge; Type: TABLE; Schema: chainsight; Owner: -
--

CREATE TABLE chainsight.semantic_edge (
    id bigint NOT NULL,
    source_evidence_id uuid NOT NULL,
    target_evidence_id uuid NOT NULL,
    score double precision NOT NULL,
    edge_type text DEFAULT 'semantic'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: semantic_edge_id_seq; Type: SEQUENCE; Schema: chainsight; Owner: -
--

CREATE SEQUENCE chainsight.semantic_edge_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: semantic_edge_id_seq; Type: SEQUENCE OWNED BY; Schema: chainsight; Owner: -
--

ALTER SEQUENCE chainsight.semantic_edge_id_seq OWNED BY chainsight.semantic_edge.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: anchor_tx id; Type: DEFAULT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.anchor_tx ALTER COLUMN id SET DEFAULT nextval('chainsight.anchor_tx_id_seq'::regclass);


--
-- Name: append_only_hash_log id; Type: DEFAULT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.append_only_hash_log ALTER COLUMN id SET DEFAULT nextval('chainsight.append_only_hash_log_id_seq'::regclass);


--
-- Name: processing_job id; Type: DEFAULT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.processing_job ALTER COLUMN id SET DEFAULT nextval('chainsight.processing_job_id_seq'::regclass);


--
-- Name: semantic_edge id; Type: DEFAULT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.semantic_edge ALTER COLUMN id SET DEFAULT nextval('chainsight.semantic_edge_id_seq'::regclass);


--
-- Name: anchor_tx anchor_tx_pkey; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.anchor_tx
    ADD CONSTRAINT anchor_tx_pkey PRIMARY KEY (id);


--
-- Name: anchor_tx anchor_tx_tx_hash_key; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.anchor_tx
    ADD CONSTRAINT anchor_tx_tx_hash_key UNIQUE (tx_hash);


--
-- Name: append_only_hash_log append_only_hash_log_current_hash_key; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.append_only_hash_log
    ADD CONSTRAINT append_only_hash_log_current_hash_key UNIQUE (current_hash);


--
-- Name: append_only_hash_log append_only_hash_log_pkey; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.append_only_hash_log
    ADD CONSTRAINT append_only_hash_log_pkey PRIMARY KEY (id);


--
-- Name: evidence evidence_cid_key; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.evidence
    ADD CONSTRAINT evidence_cid_key UNIQUE (cid);


--
-- Name: evidence evidence_pkey; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.evidence
    ADD CONSTRAINT evidence_pkey PRIMARY KEY (id);


--
-- Name: processing_job processing_job_pkey; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.processing_job
    ADD CONSTRAINT processing_job_pkey PRIMARY KEY (id);


--
-- Name: semantic_edge semantic_edge_pkey; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.semantic_edge
    ADD CONSTRAINT semantic_edge_pkey PRIMARY KEY (id);


--
-- Name: semantic_edge semantic_edge_source_evidence_id_target_evidence_id_edge_ty_key; Type: CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.semantic_edge
    ADD CONSTRAINT semantic_edge_source_evidence_id_target_evidence_id_edge_ty_key UNIQUE (source_evidence_id, target_evidence_id, edge_type);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: anchor_tx_evidence_id_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX anchor_tx_evidence_id_idx ON chainsight.anchor_tx USING btree (evidence_id);


--
-- Name: append_only_hash_log_evidence_id_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX append_only_hash_log_evidence_id_idx ON chainsight.append_only_hash_log USING btree (evidence_id);


--
-- Name: evidence_created_at_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX evidence_created_at_idx ON chainsight.evidence USING btree (created_at DESC);


--
-- Name: evidence_status_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX evidence_status_idx ON chainsight.evidence USING btree (status);


--
-- Name: processing_job_evidence_id_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX processing_job_evidence_id_idx ON chainsight.processing_job USING btree (evidence_id);


--
-- Name: processing_job_status_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX processing_job_status_idx ON chainsight.processing_job USING btree (status);


--
-- Name: semantic_edge_source_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX semantic_edge_source_idx ON chainsight.semantic_edge USING btree (source_evidence_id);


--
-- Name: semantic_edge_target_idx; Type: INDEX; Schema: chainsight; Owner: -
--

CREATE INDEX semantic_edge_target_idx ON chainsight.semantic_edge USING btree (target_evidence_id);


--
-- Name: evidence evidence_created_notify; Type: TRIGGER; Schema: chainsight; Owner: -
--

CREATE TRIGGER evidence_created_notify AFTER INSERT ON chainsight.evidence FOR EACH ROW EXECUTE FUNCTION chainsight.notify_evidence_created();


--
-- Name: evidence evidence_touch_updated_at; Type: TRIGGER; Schema: chainsight; Owner: -
--

CREATE TRIGGER evidence_touch_updated_at BEFORE UPDATE ON chainsight.evidence FOR EACH ROW EXECUTE FUNCTION chainsight.touch_updated_at();


--
-- Name: processing_job processing_job_touch_updated_at; Type: TRIGGER; Schema: chainsight; Owner: -
--

CREATE TRIGGER processing_job_touch_updated_at BEFORE UPDATE ON chainsight.processing_job FOR EACH ROW EXECUTE FUNCTION chainsight.touch_updated_at();


--
-- Name: anchor_tx anchor_tx_evidence_id_fkey; Type: FK CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.anchor_tx
    ADD CONSTRAINT anchor_tx_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES chainsight.evidence(id) ON DELETE CASCADE;


--
-- Name: append_only_hash_log append_only_hash_log_evidence_id_fkey; Type: FK CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.append_only_hash_log
    ADD CONSTRAINT append_only_hash_log_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES chainsight.evidence(id) ON DELETE CASCADE;


--
-- Name: processing_job processing_job_evidence_id_fkey; Type: FK CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.processing_job
    ADD CONSTRAINT processing_job_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES chainsight.evidence(id) ON DELETE CASCADE;


--
-- Name: semantic_edge semantic_edge_source_evidence_id_fkey; Type: FK CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.semantic_edge
    ADD CONSTRAINT semantic_edge_source_evidence_id_fkey FOREIGN KEY (source_evidence_id) REFERENCES chainsight.evidence(id) ON DELETE CASCADE;


--
-- Name: semantic_edge semantic_edge_target_evidence_id_fkey; Type: FK CONSTRAINT; Schema: chainsight; Owner: -
--

ALTER TABLE ONLY chainsight.semantic_edge
    ADD CONSTRAINT semantic_edge_target_evidence_id_fkey FOREIGN KEY (target_evidence_id) REFERENCES chainsight.evidence(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('202602280001');
