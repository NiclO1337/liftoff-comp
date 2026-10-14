import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// The Prisma CLI does not read .env itself. On Vercel there is no .env file.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Direct (unpooled) connection: migrations do not work through the pooler.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
