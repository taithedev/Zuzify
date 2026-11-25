BEGIN;
CREATE TABLE IF NOT EXISTS zuzify_comms.directory (domain text PRIMARY KEY,title text NOT NULL,category text NOT NULL CHECK(category IN ('owned','hosted')),visible boolean NOT NULL DEFAULT true,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS zuzify_comms.hub_owners (user_id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
-- Owner IDs are provisioned by a trusted database operator, never from a browser username.
GRANT SELECT ON zuzify_comms.hub_owners TO zuzify_comms_runtime;
GRANT SELECT, UPDATE(visible,updated_at) ON zuzify_comms.directory TO zuzify_comms_runtime;
GRANT SELECT(name,"createdAt",banned) ON neon_auth."user" TO zuzify_comms_runtime;
GRANT SELECT("userId","clientId",scopes) ON neon_auth."oauthConsent" TO zuzify_comms_runtime;
GRANT SELECT("clientId",name) ON neon_auth."oauthClient" TO zuzify_comms_runtime;
COMMIT;
