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
CREATE VIEW metrics AS (
	WITH glucose_rate AS (
		-- TODO limit amount of values we get if they are really dense. 5 mins should suffice.
		SELECT
			id as glucose_id,
			user_id,
			timestamp,
			"amount" as glucose,
			LEAD(amount) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "amount" AS glucose_change,
			LEAD(timestamp) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "timestamp" AS step
		FROM 
			glucose
	), insulin_rate AS (
		SELECT
			glucose_id,
			total_insulin_absorbed,
			LEAD(total_insulin_absorbed) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "total_insulin_absorbed" AS insulin_absorbed
		FROM (
			SELECT
				glucose.user_id,
				glucose.timestamp,
				glucose.id as glucose_id,
				COALESCE(SUM(total_insulin_absorbed(
					t => glucose.timestamp,
					start => insulin.timestamp,
					amount => insulin.amount
				)), 0) as total_insulin_absorbed
			FROM glucose
			LEFT JOIN insulin 
				ON glucose.user_id = insulin.user_id 
				AND insulin.timestamp <= glucose.timestamp 
			GROUP BY glucose.id
		)
	)
	
	SELECT 
		glucose_rate.glucose_id,
		LEAD(glucose_rate.glucose_id) OVER (PARTITION BY user_id ORDER BY timestamp) AS next_glucose_id,
		user_id,
		timestamp,
		glucose,
		glucose_change,
		step,
		total_insulin_absorbed,
		glucose_change / "user"."correctionRatio" * "user"."carbohydrateRatio" + insulin_absorbed * "user"."carbohydrateRatio" AS observed_carbs
	FROM glucose_rate 
	LEFT JOIN insulin_rate 
	ON insulin_rate.glucose_id = glucose_rate.glucose_id
	LEFT JOIN "user"
	ON "user"."id" = glucose_rate.user_id
	ORDER BY timestamp
)  
`)

// TODO add this and index to migration
export const attributed_carbs_base = pgMaterializedView(
  'attributed_carbs_base',
  {}
).as(sql`
   SELECT metrics.glucose_id,
    metrics.next_glucose_id,
    metrics.user_id,
    metrics."timestamp",
    metrics.glucose,
    metrics.glucose_change,
    metrics.step,
    metrics.total_insulin_absorbed,
    metrics.observed_carbs AS observed,
    carbs.id AS carbs_id,
    carbs."timestamp" AS start,
    carbs.amount,
    carbs.decay,
    LEAST(carbs."timestamp" + make_interval(mins => (carbs.decay::numeric * 1.5)::integer), metrics."timestamp" + metrics.step) - GREATEST(carbs."timestamp", metrics."timestamp") AS active_time,
    (carbs.decay::numeric * 1.5)::integer AS extended_decay,
    carbs.amount / carbs.decay::double precision AS rate,
    carbs.amount / carbs.decay::double precision / 1.5::double precision AS min_rate
   FROM metrics
     LEFT JOIN carbs ON carbs.user_id = metrics.user_id
  ORDER BY metrics.glucose_id, carbs.id;
  `)
