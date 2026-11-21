import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Public Neon Auth endpoint. Never expose a database URL or server key in browser code.
export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL ||
    "https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth",
  { adapter: BetterAuthReactAdapter() }
);
