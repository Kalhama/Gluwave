'server only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Client, Pool } from 'pg'

import config from './config.mjs'
import * as schema from './schema'

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  ssl: config.DB_SSL,
})

export const migrationClient = new Client({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  ssl: config.DB_SSL,
})

export const db = drizzle(pool, { schema })
