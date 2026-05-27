import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Load .env.local so `pnpm db:*` scripts pick up DATABASE_URL.
loadEnv({ path: ".env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
} satisfies Config;
