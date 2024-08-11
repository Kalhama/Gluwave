import {
  doublePrecision,
  pgTable,
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

export const userTable = pgTable('user', {
  id: text('id').primaryKey(),
  githubId: text('github_id').notNull().unique(),
  carbsPerUnits: doublePrecision('carbsPerUnits').notNull().default(10),
  adjustmentRate: doublePrecision('adjustmentRate').notNull().default(1),
  target: doublePrecision('target').notNull().default(6),
  insulinOnBoardOffset: doublePrecision('insulinOnBoardOffset')
    .notNull()
    .default(0),
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

/*

 WITH minutes AS (
         SELECT generate_series(( SELECT min(date_trunc('minute'::text, insulin."timestamp")) AS min
                   FROM insulin), ( SELECT max(insulin."timestamp") + '06:00:00'::interval
                   FROM insulin), '00:01:00'::interval) AS "timestamp"
        ), insulin_on_board AS (
         SELECT minutes."timestamp",
            sum(
                CASE
                    WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) THEN insulin.amount::numeric * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0 / 55::numeric + 1::numeric) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                    ELSE 0::numeric
                END) AS insulin_on_board
           FROM minutes
             LEFT JOIN insulin ON minutes."timestamp" >= insulin."timestamp"
          GROUP BY minutes."timestamp"
          ORDER BY minutes."timestamp"
        ), iac AS (
         SELECT minutes."timestamp",
            sum(
                CASE
                    WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) THEN insulin.amount::numeric * 0.000331 * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                    ELSE 0::numeric
                END) AS iob
           FROM minutes
             LEFT JOIN insulin ON minutes."timestamp" >= insulin."timestamp"
          GROUP BY minutes."timestamp"
          ORDER BY minutes."timestamp"
        )
 SELECT "timestamp",
    insulin_on_board
   FROM insulin_on_board;

   */
