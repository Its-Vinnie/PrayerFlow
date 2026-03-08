import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async development() {
      // Use DIRECT_URL for migrations to bypass pgBouncer (Supabase)
      return {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
      };
    },
  },
});
