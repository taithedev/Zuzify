import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Shared Zuzify identity is served from a dedicated Neon project.
// Public Auth endpoint only; never expose a database URL or server key to browsers.
// Before production deployment, migrate any existing user identities and update Vercel's
// VITE_NEON_AUTH_URL; changing providers does not transfer credentials or sessions.
export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL ||
    "https://ep-royal-dust-beuaeal0.neonauth.c-9.us-east-2.aws.neon.tech/zuzify/auth",
  { adapter: BetterAuthReactAdapter() }
);
