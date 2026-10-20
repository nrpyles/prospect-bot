-- Additive private CRM migration. Repeated execution preserves existing data.
DO $$ BEGIN CREATE TYPE workspace_mode AS ENUM ('agency','lending','contractor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE workspace_mode ADD VALUE IF NOT EXISTS 'contractor';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS workspace_mode workspace_mode NOT NULL DEFAULT 'agency';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_company text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS research_state text NOT NULL DEFAULT 'unchecked';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS offer_type text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS external_project_url text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS outreach_disposition text NOT NULL DEFAULT 'active';
CREATE TABLE IF NOT EXISTS prospect_research (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL CONSTRAINT prospect_research_org_id_organizations_id_fk REFERENCES organizations(id) ON DELETE CASCADE,
 prospect_id uuid NOT NULL CONSTRAINT prospect_research_prospect_id_prospects_id_fk REFERENCES prospects(id) ON DELETE CASCADE, audit jsonb NOT NULL,
 checked_at timestamp NOT NULL DEFAULT now(), CONSTRAINT research_prospect_unique UNIQUE(org_id,prospect_id));
CREATE TABLE IF NOT EXISTS prospect_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL CONSTRAINT prospect_evidence_org_id_organizations_id_fk REFERENCES organizations(id) ON DELETE CASCADE,
 prospect_id uuid NOT NULL CONSTRAINT prospect_evidence_prospect_id_prospects_id_fk REFERENCES prospects(id) ON DELETE CASCADE, source_url text NOT NULL, evidence jsonb NOT NULL,
 CONSTRAINT evidence_prospect_url_unique UNIQUE(org_id,prospect_id,source_url));
CREATE TABLE IF NOT EXISTS discovery_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL CONSTRAINT discovery_jobs_org_id_organizations_id_fk REFERENCES organizations(id) ON DELETE CASCADE,
 config jsonb NOT NULL, state text NOT NULL DEFAULT 'queued', found_count integer NOT NULL DEFAULT 0,
 added_count integer NOT NULL DEFAULT 0, review_count integer NOT NULL DEFAULT 0,
 warnings jsonb NOT NULL DEFAULT '[]'::jsonb, heartbeat_at timestamp, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS discovery_org_idx ON discovery_jobs(org_id);
CREATE TABLE IF NOT EXISTS discovery_units (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL CONSTRAINT discovery_units_job_id_discovery_jobs_id_fk REFERENCES discovery_jobs(id) ON DELETE CASCADE,
 source text NOT NULL,city text NOT NULL,industry text NOT NULL,state text NOT NULL DEFAULT 'queued',
 worker_id text,lease_until timestamp,error text);
CREATE INDEX IF NOT EXISTS discovery_unit_state_idx ON discovery_units(state,lease_until);
CREATE TABLE IF NOT EXISTS discovery_candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),org_id uuid NOT NULL CONSTRAINT discovery_candidates_org_id_organizations_id_fk REFERENCES organizations(id) ON DELETE CASCADE,
 job_id uuid NOT NULL CONSTRAINT discovery_candidates_job_id_discovery_jobs_id_fk REFERENCES discovery_jobs(id) ON DELETE CASCADE,source_url text NOT NULL,candidate jsonb NOT NULL,
 state text NOT NULL DEFAULT 'review',created_at timestamp NOT NULL DEFAULT now(),
 CONSTRAINT candidate_job_url_unique UNIQUE(job_id,source_url));
CREATE TABLE IF NOT EXISTS send_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL CONSTRAINT send_intents_org_id_organizations_id_fk REFERENCES organizations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL CONSTRAINT send_intents_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,prospect_id uuid NOT NULL CONSTRAINT send_intents_prospect_id_prospects_id_fk REFERENCES prospects(id) ON DELETE CASCADE,
 client_key uuid NOT NULL,expected_sender text NOT NULL,recipient text NOT NULL,subject text NOT NULL,body text NOT NULL,
 state text NOT NULL DEFAULT 'prepared',provider_message_id text,thread_id text,error text,
 enrollment_id uuid CONSTRAINT send_intents_enrollment_id_sequence_enrollments_id_fk REFERENCES sequence_enrollments(id) ON DELETE SET NULL, expected_step_position integer,
 sequence_step_id uuid CONSTRAINT send_intents_sequence_step_id_sequence_steps_id_fk REFERENCES sequence_steps(id) ON DELETE SET NULL,
 created_at timestamp NOT NULL DEFAULT now(),updated_at timestamp NOT NULL DEFAULT now());
ALTER TABLE send_intents ADD COLUMN IF NOT EXISTS enrollment_id uuid CONSTRAINT send_intents_enrollment_id_sequence_enrollments_id_fk REFERENCES sequence_enrollments(id) ON DELETE SET NULL;
ALTER TABLE send_intents ADD COLUMN IF NOT EXISTS expected_step_position integer;
CREATE INDEX IF NOT EXISTS send_intent_org_idx ON send_intents(org_id,prospect_id);
CREATE UNIQUE INDEX IF NOT EXISTS send_intent_key_unique ON send_intents(org_id,client_key);

CREATE UNIQUE INDEX IF NOT EXISTS send_intent_enrollment_step_unique ON send_intents(org_id,enrollment_id,expected_step_position) WHERE state IN ('prepared','sending','unknown','sent');
