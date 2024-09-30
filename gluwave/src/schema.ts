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

// TODO add migration for this
// TODO total_insulin_absorbed is numeric, not doublePrecision, but type casting works b etter now
export const metrics = pgView('metrics', {
  glucose_id: integer('glucose_id'),
  next_glucose_id: integer('next_glucose_id'),
  user_id: text('user_id'),
  timestamp: timestamp('timestamp'),
  glucose: doublePrecision('glucose'),
  glucose_change: doublePrecision('glucose_change'),
  step: interval('step'),
  total_insulin_absorbed: doublePrecision('total_insulin_absorbed'),
  observed_carbs: doublePrecision('observed_carbs'),
}).as(sql`
 WITH glucose_rate AS (
         SELECT glucose.id AS glucose_id,
            glucose.user_id,
            glucose."timestamp",
            glucose.amount AS glucose,
            COALESCE(lead(glucose.amount) OVER (PARTITION BY glucose.user_id ORDER BY glucose."timestamp") - glucose.amount, 0::double precision) AS glucose_change,
            lead(glucose."timestamp") OVER (PARTITION BY glucose.user_id ORDER BY glucose."timestamp") - glucose."timestamp" AS step
           FROM glucose
        ), insulin_rate AS (
         SELECT unnamed_subquery.glucose_id,
            unnamed_subquery.total_insulin_absorbed,
            lead(unnamed_subquery.total_insulin_absorbed) OVER (PARTITION BY unnamed_subquery.user_id ORDER BY unnamed_subquery."timestamp") - unnamed_subquery.total_insulin_absorbed AS insulin_absorbed
           FROM ( SELECT glucose.user_id,
                    glucose."timestamp",
                    glucose.id AS glucose_id,
                    COALESCE(sum(total_insulin_absorbed(t => glucose."timestamp", start => insulin."timestamp", amount => insulin.amount)), 0::numeric) AS total_insulin_absorbed
                   FROM glucose
                     LEFT JOIN insulin ON glucose.user_id = insulin.user_id AND insulin."timestamp" <= glucose."timestamp"
                  GROUP BY glucose.id) unnamed_subquery
        )
 SELECT glucose_rate.glucose_id,
    lead(glucose_rate.glucose_id) OVER (PARTITION BY glucose_rate.user_id ORDER BY glucose_rate."timestamp") AS next_glucose_id,
    glucose_rate.user_id,
    glucose_rate."timestamp",
    glucose_rate.glucose,
    glucose_rate.glucose_change,
    glucose_rate.step,
    insulin_rate.total_insulin_absorbed,
    COALESCE(glucose_rate.glucose_change / "user"."correctionRatio" * "user"."carbohydrateRatio" + insulin_rate.insulin_absorbed::double precision * "user"."carbohydrateRatio", 0::double precision) AS observed_carbs
   FROM glucose_rate
     LEFT JOIN insulin_rate ON insulin_rate.glucose_id = glucose_rate.glucose_id
     LEFT JOIN "user" ON "user".id = glucose_rate.user_id
  ORDER BY glucose_rate."timestamp";
`)
