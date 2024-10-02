import { sql } from 'drizzle-orm'
import {
  doublePrecision,
  integer,
  interval,
  pgMaterializedView,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const insulin = pgTable('insulin', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  amount: doublePrecision('amount').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
})

export const carbs = pgTable('carbs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  amount: doublePrecision('amount').notNull(),
  decay: integer('decay').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
})

export const glucose = pgTable('glucose', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  value: doublePrecision('amount').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  device: text('device'),
})

export const userTable = pgTable('user', {
  id: text('id').primaryKey(),
  githubId: text('github_id').notNull().unique(),
  carbohydrateRatio: doublePrecision('carbohydrateRatio').notNull().default(10),
  correctionRatio: doublePrecision('correctionRatio').notNull().default(1),
  target: doublePrecision('target').notNull().default(6),
  insulinOnBoardOffset: doublePrecision('insulinOnBoardOffset')
    .notNull()
    .default(0),
  apikey: text('apikey'),
})

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
})
