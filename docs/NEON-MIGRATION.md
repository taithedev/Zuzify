# Zuzify ecosystem Neon migration

Status: **staged / not a completed production migration** (2026-11-20, America/New_York).

## Identity: existing accounts must survive

**Canonical central sign-in:** Neon **Zuzify Accounts** `rough-queen-59692102` (database `neondb`, branch `main`). Its Auth service already contains **1 existing user** and has the OAuth 2.1 server enabled. Its existing public Auth URL is `https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth`.

We enabled Neon Data API for this same canonical project and created:
- `zuzify_profiles`: per-user profile with ownership-based RLS.
- `zuzify_integrations`: publicly readable directory of **12** Zuzu/Zuzify apps, assigned Neon project IDs where known. All `is_live` flags remain false until deployments are verified.
- `zuzify_account_links`: user-owned, authenticated-readable record for verified cross-app links. **No browser-side INSERT/UPDATE/DELETE permission**; future app backends must verify both account ownership and OAuth tokens before adding a link.

The newer project `young-truth-44623930`, previously called **Zuzify Identity**, was created separately but contains **zero Neon Auth users**. It has been renamed **Zuzify App Data** and should **not** replace the existing central sign-in. Do not change the canonical Vercel `VITE_NEON_AUTH_URL` to the newer empty project's URL.

No OAuth clients were registered yet for the independent apps; a registered client requires an actual owned HTTPS redirect URI and a verified application callback implementation. No existing accounts were merged.

## App data: work actually prepared

- **Rhythm.play:** Staged a separate draft PR to replace the public Supabase leaderboard/catalog with Neon Data API. The new `Zuzify App Data` `zuzify` database has `rhythm_scores` (1 copied historical record) and `rhythm_skins` (6 copied catalog records), with verified source/destination counts and anonymous read/guest-score RLS. The actual deployed Rhythm origin must be added to the Neon Data API CORS list before cutover. Need a final delta copy before launch.
- **ZuzuMusic:** Created separate `zuzumusic` database on the `Zuzify App Data` Neon project and applied the repository's `database/schema.sql` (`zm_users`, `zm_tracks`, indexes). This is ready for a future server-side `DATABASE_URL` connection; there is no verified Vercel deployment, no live secret configured, and no shared OAuth account integration yet.
- **ZuzuCord / Kova / ZuzuLoader:** Existing individual Neon projects were detected. Existing project != verified production cutover. Follow app-specific runbooks.
- **ZuzuAI, PrezzStore, Zuzify Discord Bot, Vertex-X, ZuzuOS, Winglass, FastProxy and other legacy apps:** Supabase dependencies remain. Data and files must be migrated with verified account mapping and app-specific auth/storage/realtime replacements.

## Supabase is still active (no deletion)

Source: `wfqudstuncdldsvxqveu`. Real record counts were found in `zuzucord_accounts` (5), `zuzuai_accounts` (8), `zuzuai_chats` (38), `zuzuai_messages` (103), `prezzstore_stores` (5), `vertexx_profiles` (1), `rhythm_scores` (1) and `rhythm_skins` (6). PostgreSQL estimated row counts of zero from a metadata endpoint are *not* evidence of an empty table.

## Required safe cutover process per application

1. Identify the **actual running** API/backend and how it uses Supabase Auth, Storage, Edge Functions, RLS, Realtime, and webhooks.
2. Export and verify a full Supabase backup (including files and all foreign keys), with source/destination row counts.
3. Apply Neon tables/indexes/policies to an isolated database, set least-privilege roles and a trusted server-side database URL. No `DATABASE_URL` in browser code, desktop binaries, or GitHub.
4. Copy data without changing existing user identifiers unexpectedly. Existing Supabase Auth accounts cannot be made into Neon accounts merely by switching URLs; identity migrations must prove user ownership and preserve access.
5. Implement the Zuzify OAuth authorization-code flow with PKCE where appropriate. Register a **distinct client and exact redirect URI** for each app, validate issuer/JWKS/audience/scope/server-side, and explicitly link a local app account after verifying both identities.
6. Rebuild equivalent storage/signing, file access, auth/RLS, realtime and subscription/payment workflows when needed. Never expose cross-account data or infer app permissions from a raw client-supplied ID.
7. Test sign-up, sign-in, sessions, owner roles, read/write isolation, old messages, score and catalog reads, uploads, moderation, realtime, billing webhooks, error and rollback flows.
8. Update deployment secrets and release in stages with a verified final delta copy and a read-only fallback. **Do not delete Supabase yet.**

## Draft branches

- Zuzify identity registry/status dashboard: `taithedev/Zuzify` PR #1.
- Rhythm.play leaderboard/catalog migration: `taithedev/Rhythm.play` PR #1.

Neither draft PR should be merged until the corresponding runtime, domain settings, and deployment tests pass.
