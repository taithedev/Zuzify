# Global hub

The directory is seeded from verified Vercel domain/project inventory: four registered domains and 21 production aliases. Public queries only return visible records. Hiding a site does not delete or take down its deployment. To refresh the inventory, a trusted operator reads Vercel and GitHub metadata and upserts directory domain/title/category without changing visibility. Automatic synchronization is not enabled. GitHub repositories alone are not treated as websites.

The owner console uses a server-side allowlist of immutable central account IDs plus verified email and non-banned status. It shows central account display names, IDs, verification status and granted OAuth client/scopes, not private messages or credentials. Account and support lists are paginated. The owner can toggle site visibility, reply to support tickets, and queue an individual news notice. Other apps must expose explicitly authorized, scoped admin APIs before app-specific staff controls can be used from the hub. Do not share app database passwords with the browser or assume local ranks are centrally granted.

Apply global-hub.sql after communications.sql. Configure server variables and verify email OTP delivery. The /owner route requires a real, verified account; no client-side flag grants access. Production rollout requires preview build and smoke tests.
