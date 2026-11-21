import { createClient } from "@neon/neon-js";

// Public endpoints only. Never place a PostgreSQL connection string or server key in VITE_ variables.
// Both endpoints belong to the dedicated Zuzify Identity Neon project.
export const neon = createClient({
  auth: {
    url: import.meta.env.VITE_NEON_AUTH_URL ||
      "https://ep-royal-dust-beuaeal0.neonauth.c-9.us-east-2.aws.neon.tech/zuzify/auth",
  },
  dataApi: {
    url: import.meta.env.VITE_NEON_DATA_API_URL ||
      "https://ep-royal-dust-beuaeal0.apirest.c-9.us-east-2.aws.neon.tech/zuzify/rest/v1",
  },
});
