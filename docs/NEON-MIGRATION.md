# Zuzu / Zuzify → Neon migration

Last inventoried: 2026-11-20 (EST). **Stage: in progress, NOT a production cutover.**

## Source of truth and existing deployments

- Legacy Supabase project: `wfqudstuncdldsvxqveu` (still active). **DO NOT delete** it or its auth/storage/users.
- Neon Zuzify Identity: `young-truth-44623930`, database `zuzify`, default branch `main`. Neon Auth, Data API and OAuth provider are enabled. Trusted origins: `zuzify.xyz`, `www.zuzify.xyz`, `zuzify.lol`.
- Existing Neon projects: Kova (`icy-block-30907888`), ZuzuCord (`wild-voice-54090891`), ZuzuCord PG18 (`rapid-paper-52693216`), ZuzuLoader (`floral-wind-62267468`).
- Important: Existing ZuzuCord/Kova Neon Auth projects are **not automatically the same identity database** as Zuzify Identity. Each application must explicitly implement Zuzify OAuth 2.1 linking before its accounts can be connected.

## Repository audit / migration status

| Project | Found | Next step |
| --- | --- | --- |
| Zuzify (.xyz) | Existing Neon Auth React account center and OAuth pages; existing endpoint pointed to a different Neon project | This branch stages a dedicated Zuzify Identity endpoint. Verify compatibility, old identity migration, and Vercel env before merging. |
| Zuzify (.lol) | Static Vite community/experimental site | No application database migration yet identified; use central sign-in only where needed. |
| ZuzuCord | Neon migrations, APIs, *and* old Supabase folder | Follow `neon/MIGRATION-CUTOVER.md`; verify active client routes, real account records, authentication, realtime and attachments, then release. |
| ZuzuCord Developers | Separate developer UI/CLI | Make it use production ZuzuCord/Neon roles and verified tokens after the main ZuzuCord cutover. |
| Kova | Neon project exists | Verify live clients and APIs; optionally add explicit Continue with Zuzify consent. |
| ZuzuLoader | Neon project exists | Verify current clients use it; link accounts via OAuth rather than copying passwords. |
| ZuzuMusic | Repository's database schema targets Neon `DATABASE_URL` | Verify production deployment and create/apply its schema in an approved Neon project. |
| ZuzuAI | Supabase schema and `src/lib/supabase.ts` | Port auth, chat/credits persistence, account roles, file handling and every query; migrate records. |
| ZuzifyDiscordBot | `@supabase/supabase-js` in `src/db.ts`, Supabase env and schema | Implement Neon server-side database access; preserve account-link flows, bot state and role checks, then deploy bot secrets. |
| PrezzStore | Supabase client/auth/SSR, database schema and payment flows | Migrate auth and all store/order/payment tables before changing production endpoints; verify payment webhook idempotency. |
| Rhythm.play | Supabase schema and client code | Port score/profile persistence and session checks to Neon, then migrate leaderboards. |
| Vertex-X | Supabase schema | Port profile, roles, wallet, credits and script data with trusted server-side authorization. |
| ZuzuOS / legacy zuzu.os | Legacy Supabase tables for ZuzuOS exist | Review current app entrypoints; preserve profiles, PIN hashes, roles and licenses if they are still used. |
| Winglass | Supabase tables exist | Replace preferences/catalog access only after inspecting the active app. |
| Fastproxy | Supabase tables exist | Migrate profile/settings/history/subscription data if the app remains active. |
| Other Zuzify repos | Not all apps need a database | Only make a migration when a live Supabase dependency is verified. |

## Verified data warning

Supabase `list_tables` showed *estimated* row counts of zero, which are not reliable. Real `COUNT(*)` checks on 2026-11-20 showed nonzero records in `zuzucord_accounts` (5), `zuzuai_accounts` (8), `prezzstore_stores` (5) and `vertexx_profiles` (1). Treat all legacy data as real and preserve it.

## Cutover steps for EACH app

1. Identify the deployed repo/branch, API service, auth provider, secrets and usage of Supabase Auth, Realtime, Storage, Edge Functions, RLS, triggers and SQL functions.
2. Create a complete, verified backup of the legacy database and storage; inventory record counts including tables without stable statistics.
3. Create the Neon schema and server-side APIs on an isolated environment, using least-privilege roles, valid ownership checks and no browser-exposed DB credentials. Do not copy Supabase `auth.uid()` policies without adapting the JWT verification and RLS context.
4. Copy records preserving stable business identifiers; explicitly map Supabase Auth users to Neon Auth identities through a validated account claim/migration flow. Never treat a matching email or client-supplied user ID as proof of ownership.
5. Migrate associated files (Supabase Storage is not the same as PostgreSQL) and implement replacement websocket, webhook, scheduled job and function facilities where needed.
6. Verify login/signup/logout/reset, permissions, roles, moderation, purchases, linked accounts, old data integrity and deployment logs in staging. Reconcile row counts and key foreign relations.
7. Update server-side secrets and Vercel/desktop/CI environment variables, then deploy client changes and verify the actual production traffic. Use a staged/feature-flagged cutover with rollback. Do not force a database switch ahead of credentials/data migration.
8. Retain Supabase read-only as necessary for rollback until a completed reconciliation. No deletion or transfer of user data is authorized by this checklist.

## Zuzify Identity integration contract

- Central account: Neon Auth in the Zuzify Identity project.
- App database: may be a separate Neon project. Central identity and app data must not rely on a shared unverified username.
- OAuth provider: `https://zuzify.xyz/oauth/login` and `https://zuzify.xyz/oauth/consent`; an app must have a registered OAuth client with an exact redirect URI and PKCE where applicable.
- App's own backend validates issuer, audience, signature, expiry, client, and scopes. Do not ask users to enter Zuzify passwords directly into another app.
- Database registry: `zuzify_app_catalog` lists apps with `supports_identity_linking=false` until OAuth implementation is live; `zuzify_app_connections` is read-only to browser users, so no self-asserted links.
- Client auth endpoint (public): `https://ep-royal-dust-beuaeal0.neonauth.c-9.us-east-2.aws.neon.tech/zuzify/auth`.
- Before merging this PR, confirm whether accounts exist under the older `ep-rough-recipe-bcjp6wq7` endpoint and migrate them or explicitly require new enrollment. Merely changing `VITE_NEON_AUTH_URL` would switch identity providers and invalidate old sessions.

## Acceptance gate

**No app is considered migrated merely because a Neon project exists or because a repo contains a `neon/` directory.** Mark complete only after an application-level build, credential tests, record parity, production routing verification, and a rollback plan. This PR intentionally does not change Supabase services, customer records, payment wiring, production env vars or live deployments.
