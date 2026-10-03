import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads the URL from schema.prisma. `prisma generate` works without
// DATABASE_URL (Vercel builds, CI); migrate / seed / studio need it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
