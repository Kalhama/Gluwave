import config from '@/config.mjs'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    database: config.DB_DATABASE,
    ssl: config.DB_SSL,
  },
})
