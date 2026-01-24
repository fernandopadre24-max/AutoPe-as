import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/database/schema.ts',
  out: './src/lib/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './.database/loja2026.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;