# Zuzify ID — central accounts

Source: `apps/xyz`. Database: Neon project **Zuzify Accounts**, distinct from ZuzuCord, Kova, and other app databases.

## Current functionality

- Public home page is a minimal website directory (name, description, URL, and By Zuzify credit). Network/map and old portal navigation are removed.
- Sign up, sign in, signed-in sessions, display name editing, and basic account profile backed by Neon managed Better Auth.
- `/account` shows actual OAuth application consents returned by Neon; it does not claim to read records from applications that have not integrated Zuzify ID.
- `/oauth/login` and `/oauth/consent` are the OAuth provider's app-controlled login and consent pages. These must remain publicly reachable.
- Each app gets its own OAuth client registration and distinct redirect URI. Public clients use PKCE. Desktop, web, mobile and games must implement code-flow redirects and token verification properly.
- All apps must use the central Neon user ID as the stable cross-app identity. Store app-specific data separately, keyed to verified identity; do not merge existing accounts automatically.

## Neon setup

- Neon project ID: `rough-queen-59692102`
- Auth provider: Better Auth
- Public auth base URL: `https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth`
- Trusted domains: `https://zuzify.xyz`, `https://www.zuzify.xyz`
- OAuth provider login page: `https://zuzify.xyz/oauth/login`
- OAuth provider consent page: `https://zuzify.xyz/oauth/consent`
- The public Auth URL is safe in frontend code. **Never put the Postgres connection string, OAuth client secrets, or Neon secret server key in Vite environment variables.**
- Email/password sign up is configured. Before public launch, configure email verification and working transactional mail delivery. Require unique verified emails before linking accounts across services.

## Integrating another Zuzify app

1. Register the app as its own client in Neon Auth OAuth provider settings with exact redirect URI(s). Use authorization code + PKCE for public/native apps.
2. Use the discovery document provided by Neon Auth to configure the client; never accept arbitrary identity tokens from other projects.
3. Verify issuer, signature, audience, expiration, and authorized scopes **server-side** before granting access to app data. Never send refresh tokens, credentials, or a central database connection to the browser.
4. Persist a verified mapping from `neon_auth.user.id` (central identity) to the app-local profile when users explicitly link an existing account. Confirm ownership of BOTH accounts before linking; do not match solely by username/email.
5. Define each app's allowed data scopes. Build a protected app-side API to return only data belonging to the authenticated Zuzify ID. The central account page can then show connected app data only after those APIs are integrated and consented.
6. For games, exchange OAuth tokens on a trusted game backend. Never store client secrets in builds or trust player-submitted user IDs.

## Remaining rollout work

The OAuth provider is configured, but independent apps are **not connected automatically**. Register clients and add the login flow inside ZuzuCord, Kova, ZuzuMusic, Zuzify Hub and games one at a time. Add per-app data APIs to show activity/statistics. Run end-to-end sign up, password reset, consent, denial, and client callback tests against a preview branch before public launch.

## Discord pairing: Bot-Hosting + Zuzify ID

- Zuzify.xyz serves `/link` and `/link?code=<one-time-code>&service=zuzify`; signed-in users can also type the code from the bot at `/link` or from Account → Link Discord.
- `apps/xyz/api/link/complete.js` is a same-origin, server-only Vercel Edge Function. It sends the signed Neon Auth JWT and one-time code to the bot's existing `POST /api/v1/link/complete`. The bot verifies the JWT and uses its private Neon schema to consume the challenge. No Discord bot credentials or database URL appear in browser code.
- Add `BOT_LINK_API_URL` to **the Zuzify.xyz Vercel project's server environment**. The value must be the bot's *live HTTPS origin*, with no path. Do not use the currently unassigned Bot-Hosting hostname until `/health` returns a JSON success.
- On Bot-Hosting, go to the bot deployment → Domains and activate/attach its assigned subdomain. Verify the HTTP server listens on `0.0.0.0` and `process.env.PORT` (or its configured `BOT_API_PORT`). Confirm `https://<bot-host>/health` returns `ok:true`, not the platform 404 page.
- Set bot `BOT_PUBLIC_URL=https://zuzify.xyz` so future `/linkaccount` links land on the account website. Do this in the bot host's private env settings, not through GitHub; the other bot-maintenance chat should coordinate its rollout. Keep the bot's `/api/v1/link/complete` endpoint available at the configured `BOT_LINK_API_URL`.
- The existing bot implementation creates long 64-character one-time links. Short, user-readable pairing codes require a *separate compatible bot change* (the site form accepts them, but the bot must generate, persist, expire, rate-limit, and validate them). Do not change the bot's main branch from the website workstream.
- Do not post pairing codes publicly or capture them in telemetry. Regenerate challenges when expired. The site can only show success after the bot verifies and consumes the code.
