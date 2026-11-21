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
