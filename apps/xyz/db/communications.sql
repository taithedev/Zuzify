BEGIN;
CREATE SCHEMA IF NOT EXISTS zuzify_comms;
REVOKE ALL ON SCHEMA zuzify_comms FROM PUBLIC;
CREATE TABLE IF NOT EXISTS zuzify_comms.preferences (
 user_id text PRIMARY KEY, news boolean NOT NULL DEFAULT false, transactional boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS zuzify_comms.tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, app text NOT NULL,
 subject text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','answered','closed')),
 reply text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_user_date ON zuzify_comms.tickets(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS zuzify_comms.notices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, kind text NOT NULL,
 title text NOT NULL, body text NOT NULL, event_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz
);
CREATE INDEX IF NOT EXISTS notices_user_date ON zuzify_comms.notices(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS zuzify_comms.outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notice_id uuid NOT NULL REFERENCES zuzify_comms.notices(id),
 user_id text NOT NULL, kind text NOT NULL, sent_at timestamptz, attempts int NOT NULL DEFAULT 0,
 next_attempt timestamptz NOT NULL DEFAULT now(), UNIQUE(notice_id,kind)
);
REVOKE ALL ON ALL TABLES IN SCHEMA zuzify_comms FROM PUBLIC;
COMMIT;
