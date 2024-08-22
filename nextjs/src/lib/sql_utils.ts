import { db } from '@/db'
import { carbs, insulin, userTable } from '@/schema'
import { startOfMinute, subHours } from 'date-fns'
import { and, eq, sql } from 'drizzle-orm'

export const calculateUserInsulinData = async (
  from: Date,
  to: Date,
  userId: string
) => {
  const minutes = db.$with('minutes').as(
    db
      .select({
        timestamp: sql<Date>`timestamp`
          .mapWith(insulin.timestamp)
          .as('timestamp'),
      })
      .from(
        sql`
    generate_series(${from}, ${to}, '00:01:00'::interval) AS "timestamp"
  `
      )
  )

  const insulin_on_board = await db
    .with(minutes)
    .select({
      timestamp: sql`minutes.timestamp`.mapWith(
        insulin.timestamp
      ) /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */,
      insulinOnBoard: sql`SUM(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '08:00:00'::interval) 
                 THEN insulin.amount::numeric * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0 / 55::numeric + 1::numeric) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                 ELSE 0::numeric
             END)`
        .mapWith(insulin.amount)
        .as('insulin_on_board'),
      insulinEffect: sql`
        sum(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '08:00:00'::interval) 
                 THEN insulin.amount::numeric * 0.000331 * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                 ELSE 0::numeric
             END)
        `
        .mapWith(insulin.amount)
        .as('insulin_on_board'),
    })
    .from(minutes)
    .leftJoin(
      insulin,
      and(
        sql`minutes."timestamp" >= insulin."timestamp"`,
        eq(insulin.userId, userId)
      )
    )
    .groupBy(
      sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
    )
    .orderBy(minutes.timestamp)

  return insulin_on_board
}

export const calculateUserCarbsData = async (
  from: Date,
  to: Date,
  userId: string
) => {
  const minutes = db.$with('minutes').as(
    db
      .select({
        timestamp: sql<Date>`timestamp`
          .mapWith(carbs.timestamp)
          .as('timestamp'),
      })
      .from(
        sql`
    generate_series(${from}, ${to}, '00:01:00'::interval) AS "timestamp"
  `
      )
  )

  const carbs_on_board = await db
    .with(minutes)
    .select({
      timestamp: sql`minutes.timestamp`.mapWith(
        carbs.timestamp
      ) /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */,
      carbsOnBoard: sql`sum(
             CASE
                 WHEN minutes."timestamp" >= carbs."timestamp" AND minutes."timestamp" < (carbs."timestamp" + MAKE_INTERVAL(mins => carbs.decay)) THEN 
                    "carbs"."amount"::numeric * (1 - EXTRACT(epoch FROM minutes."timestamp" - carbs."timestamp") / 60.0 / carbs.decay)
                 ELSE 0::numeric
             END)`
        .mapWith(carbs.amount)
        .as('carbs_on_board'),
    })
    .from(minutes)
    .leftJoin(
      carbs,
      and(
        sql`minutes."timestamp" >= carbs."timestamp"`,
        eq(carbs.userId, userId)
      )
    )
    .groupBy(
      sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
    )
    .orderBy(minutes.timestamp)

  return carbs_on_board
}

export const getData2 = async (from: Date, to: Date, userId: string) => {
  const user = (
    await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1)
  )[0]

  if (!user) {
    throw new Error('did not find user with userId')
  }

  const minutes = db.$with('minutes').as(
    db
      .select({
        timestamp: sql<Date>`timestamp`
          .mapWith(carbs.timestamp)
          .as('timestamp'),
      })
      .from(
        sql`
    generate_series(
        ${subHours(startOfMinute(from), 0)}, 
        ${to}, 
        '00:01:00'::interval) AS "timestamp"
  `
      ) // todo test if we need to subhours
  )

  // WARNING: this does not essentially start form 0
  const cumulativeInsulinEffect = db.$with('cumulative_insulin_effect').as(
    db
      .with(minutes)
      .select({
        timestamp: sql`minutes.timestamp`
          .mapWith(carbs.timestamp)
          .as('timestamp'),
        cumulativeInsulinEffect:
          sql`COALESCE(SUM(((((EXTRACT(EPOCH FROM minutes.timestamp - insulin.timestamp)/60/55)+1) * EXP(-((EXTRACT(EPOCH FROM minutes.timestamp - insulin.timestamp)/60/55)))) - 1) * insulin.amount), 0) * ${user?.correctionRatio}`
            .mapWith(insulin.amount)
            .as('cumulative_insulin_effect'),
      })
      .from(minutes)
      .leftJoin(
        insulin,
        and(
          sql`insulin."timestamp" <= minutes."timestamp"`,
          sql`insulin."timestamp" >= (${from}::timestamp - interval '8 hours')`,
          eq(insulin.userId, userId)
        )
      )
      .groupBy(
        sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
      )
      .orderBy(
        sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
      )
  )

  // WARNING: this does not essentially start form 0
  const cumulativeCarbsEffect = db.$with('cumulative_carbs_effect').as(
    db
      .with(minutes)
      .select({
        timestamp: sql`minutes.timestamp`
          .mapWith(carbs.timestamp)
          .as('timestamp'),
        cumulativeCarbsEffect: sql`SUM(
          COALESCE(LEAST(1, EXTRACT(epoch FROM minutes.timestamp - carbs.timestamp) / 60 / carbs.decay) * carbs.amount / ${user?.carbohydrateRatio} * ${user?.correctionRatio}, 0)
        )`
          .mapWith(carbs.amount)
          .as('cumulative_carbs_effect'),
      })
      .from(minutes)
      .leftJoin(
        carbs,
        and(
          sql`carbs."timestamp" <= minutes."timestamp"`,
          sql`carbs."timestamp" >= (${from}::timestamp - interval '12 hours')`,
          eq(carbs.userId, userId)
        )
      )
      .groupBy(
        sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
      )
      .orderBy(
        sql`minutes.timestamp` /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */
      )
  )

  const results = await db
    .with(cumulativeCarbsEffect, cumulativeInsulinEffect)
    .select({
      timestamp: sql`cumulative_insulin_effect.timestamp`.mapWith(
        insulin.timestamp
      ),
      cumulativeCarbsEffect: sql`cumulative_carbs_effect`.mapWith(
        insulin.amount
      ),
      cumulativeInsulinEffect: sql`cumulative_insulin_effect`.mapWith(
        insulin.amount
      ),
      totalEffect:
        sql`cumulative_insulin_effect + cumulative_carbs_effect`.mapWith(
          insulin.amount
        ),
    })
    .from(cumulativeCarbsEffect)
    .leftJoin(
      cumulativeInsulinEffect,
      sql`cumulative_insulin_effect.timestamp = cumulative_carbs_effect.timestamp`
    )

  return results
}
