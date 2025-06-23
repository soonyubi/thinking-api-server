import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3307,
    user: 'test_user',
    password: 'test_password',
    database: 'test_db',
  },
});
