import { db } from '@/db'
import { carbs, insulin } from '@/schema'
import { parseISO } from 'date-fns'
import { and, eq, sql } from 'drizzle-orm'

export const calculateUserInsulinData = async (userId: string) => {
  const minutes = db.$with('minutes').as(
    db
      .select({
        timestamp: sql<Date>`timestamp`
          .mapWith(insulin.timestamp)
          .as('timestamp'),
      })
      .from(
        sql`
    generate_series(
        ( SELECT min(date_trunc('minute'::text, insulin."timestamp")) AS min
                FROM insulin WHERE ${insulin.userId} = ${userId}), ( SELECT max(insulin."timestamp") + '06:00:00'::interval
                FROM insulin WHERE ${insulin.userId} = ${userId}), '00:01:00'::interval) AS "timestamp"
  `
      )
  )

  const insulin_on_board = await db
    .with(minutes)
    .select({
      timestamp: sql`minutes.timestamp`.mapWith(
        insulin.timestamp
      ) /* using sql because using 'minutes.timestamp' returns only 'timestamp' which is ambiguous */,
      insulinOnBoard: sql`sum(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) 
                 THEN insulin.amount::numeric * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0 / 55::numeric + 1::numeric) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                 ELSE 0::numeric
             END)`
        .mapWith(insulin.amount)
        .as('insulin_on_board'),
      insulinEffect: sql`
        sum(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) 
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

export const calculateUserCarbsData = async (userId: string) => {
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
        ( SELECT min(date_trunc('minute'::text, carbs."timestamp")) AS min
                FROM carbs WHERE ${carbs.userId} = ${userId}), ( SELECT max(carbs."timestamp") + '06:00:00'::interval
                FROM carbs WHERE ${carbs.userId} = ${userId}), '00:01:00'::interval) AS "timestamp"
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
