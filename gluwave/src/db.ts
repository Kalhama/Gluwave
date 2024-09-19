'server only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Client, Pool } from 'pg'

import config from './config.mjs'
import * as schema from './schema'

const pool = new Pool({
  connectionString: config.DATABASE_URL,
})

export const migrationClient = new Client({
  connectionString: config.DATABASE_URL_UNPOOLED,
})

export const db = drizzle(pool, { schema })
