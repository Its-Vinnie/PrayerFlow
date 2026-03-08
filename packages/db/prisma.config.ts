import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Use DIRECT_URL for schema push/migrations to bypass pgBouncer (Supabase)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  migrate: {
    async development() {
      return {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
      };
    },
  },
});
