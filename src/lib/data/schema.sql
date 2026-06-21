-- Mona J AI — Central Data Layer (PostgreSQL)
-- Production schema. Build this first (spec §3). The app currently runs on an
-- in-memory implementation of these exact shapes (see store.ts); swap the
-- repositories to this schema when DATABASE_URL is provided.
--
--   createdb mona_j_ai && psql mona_j_ai -f schema.sql
--   (requires the pgvector extension for the Product Expert knowledge base)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";     -- Product Expert RAG embeddings

-- ─── 3.1 Lead Store ─────────────────────────────────────────────────────────
CREATE TYPE lead_source     AS ENUM ('lead_hunter','csv_import','inbound','referral');
CREATE TYPE business_type   AS ENUM ('salon','distributor','store','individual');
CREATE TYPE lead_stage      AS ENUM ('new','contacted','engaged','meeting_booked',
                                     'purchase_intent','customer','churned','suppressed');
CREATE TYPE consent_status  AS ENUM ('opted_in','opted_out','pending');

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          lead_source     NOT NULL,
  business_name   TEXT,
  contact_name    TEXT,
  email           TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  city            TEXT,
  business_type   business_type,
  score           INT  NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  stage           lead_stage      NOT NULL DEFAULT 'new',
  consent_status  consent_status  NOT NULL DEFAULT 'pending',
  enrichment_data JSONB           NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_stage   ON leads (stage);
CREATE INDEX idx_leads_consent ON leads (consent_status);

-- ─── 3.2 Conversation Store ─────────────────────────────────────────────────
CREATE TYPE channel          AS ENUM ('whatsapp','linkedin','email','instagram','web_chat');
CREATE TYPE direction        AS ENUM ('inbound','outbound');
CREATE TYPE detected_intent  AS ENUM ('interest','objection','meeting_intent',
                                      'purchase_intent','support','complaint','none');

CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel           channel NOT NULL,
  direction         direction NOT NULL,
  message_body      TEXT,
  detected_intent   detected_intent NOT NULL DEFAULT 'none',
  handled_by_module TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conv_lead ON conversations (lead_id);

-- ─── 3.3 Order & Payment Store ──────────────────────────────────────────────
CREATE TYPE order_status   AS ENUM ('cart','pending_payment','paid','failed','refunded');
CREATE TYPE payment_method AS ENUM ('stripe','paypal','bank_transfer');

CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status         order_status NOT NULL DEFAULT 'cart',
  items          JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_pkr      NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method payment_method,
  invoice_url    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_lead   ON orders (lead_id);
CREATE INDEX idx_orders_status ON orders (status);

-- ─── 3.4 Event Bus ──────────────────────────────────────────────────────────
CREATE TYPE event_status AS ENUM ('pending','processed','exception');

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  routed_to   TEXT,
  status      event_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_type   ON events (event_type);

-- Orchestration via LISTEN/NOTIFY for the MVP (spec §8). Modules subscribe to
-- 'mona_events'; the orchestrator routes by event_type → responsible module.
CREATE OR REPLACE FUNCTION notify_event() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('mona_events', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_notify AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION notify_event();

-- ─── §4 Control center config (versioned, auditable) ────────────────────────
CREATE TABLE config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version    INT  NOT NULL,
  document   JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── §9 Audit log (every config change + gate decision) ─────────────────────
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor      TEXT,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── §5.4 Product Expert knowledge base (RAG) ───────────────────────────────
CREATE TABLE kb_chunks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT NOT NULL,             -- catalog | ingredients | competitive | faq
  title      TEXT,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops);
