import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// This existing Zuzify Accounts Neon Auth project already contains user accounts.
// Keep it as the canonical identity provider; do not switch to an empty project.
export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL ||
    "https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth",
  { adapter: BetterAuthReactAdapter() }
);
