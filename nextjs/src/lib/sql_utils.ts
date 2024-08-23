import { db } from '@/db'
import { carbs, glucose, insulin, userTable } from '@/schema'
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

export const observedCarbs = async (from: Date, to: Date, userId: string) => {
  /**
   * Problems with this function
   * 1. We calculate cumulative insulin decay for every blood glucose, but then later on we group by ~ 30 minutes.
   *      - It would be more optimal to group by first and then calculate insulin decay for longer steps.
   */

  const user = (
    await db.select().from(userTable).where(eq(userTable.id, userId))
  )[0]

  if (!user) {
    throw new Error('user not found')
  }

  // calculate cumulative insulin decay for every glucose measurement
  const cumulative_insulin_decay = db.$with('cumulative_insulin_decay').as(
    db
      .select({
        timestamp: sql`glucose.timestamp`
          .mapWith(glucose.timestamp)
          .as('timestamp'),
        cumulative_insulin_decay:
          sql`COALESCE(SUM(((((EXTRACT(EPOCH FROM glucose.timestamp - insulin.timestamp)/60/55)+1) * EXP(-((EXTRACT(EPOCH FROM glucose.timestamp - insulin.timestamp)/60/55)))) - 1) * insulin.amount), 0)`.as(
            'cumulative_insulin_decay'
          ),
      })
      .from(glucose)
      .leftJoin(
        insulin,
        and(
          sql`glucose.timestamp >= insulin.timestamp`,
          eq(insulin.userId, userId)
        )
      )
      .where(
        and(
          eq(glucose.userId, userId),
          sql`glucose.timestamp > ${from}`,
          sql`glucose.timestamp < ${to}`
        )
      )
      .groupBy(sql`glucose.timestamp`)
      .orderBy(sql`glucose.timestamp`)
  )

  // for every timestamp, calculate how much insulin and glucose changes etc...
  const insulin_decay_and_glucose_change = db
    .$with('insulin_decay_and_glucose_change')
    .as(
      db
        .with(cumulative_insulin_decay)
        .select({
          timestamp: sql`cumulative_insulin_decay.timestamp`
            .mapWith(glucose.timestamp)
            .as('timestamp'),
          interval_length:
            sql`LEAD(cumulative_insulin_decay.timestamp) OVER (ORDER BY cumulative_insulin_decay.timestamp) - cumulative_insulin_decay.timestamp `.as(
              'interval_length'
            ),
          glucose: sql`glucose.amount`.as('glucose'),
          glucose_change:
            sql`LEAD(glucose.amount) OVER (ORDER BY cumulative_insulin_decay.timestamp) - glucose.amount`.as(
              'glucose_change'
            ),
          insulin_decay:
            sql`LEAD(cumulative_insulin_decay) OVER (ORDER BY cumulative_insulin_decay.timestamp) - cumulative_insulin_decay`.as(
              'insulin_decay'
            ),
        })
        .from(cumulative_insulin_decay)
        .leftJoin(
          glucose,
          and(
            sql`glucose.timestamp = cumulative_insulin_decay.timestamp`,
            eq(glucose.userId, userId)
          )
        )
    )

  // calculate how much carbs there needs to be for glucose change to be what it is
  const observed_carbs = db.$with('observed_carbs').as(
    db
      .with(insulin_decay_and_glucose_change)
      .select({
        timestamp: sql`timestamp`.mapWith(glucose.timestamp).as('timestamp'),
        interval_length: sql`interval_length`.as('interval_length'),
        glucose: sql`glucose`.mapWith(glucose.value).as('glucose'),
        glucose_change: sql`glucose_change`
          .mapWith(glucose.value)
          .as('glucose_change'),
        insulin_decay: sql`insulin_decay`
          .mapWith(glucose.value)
          .as('insulin_decay'),
        observed_carbs:
          sql`(glucose_change - insulin_decay * ${user.correctionRatio}) * (${user.carbohydrateRatio / user.correctionRatio})`
            .mapWith(glucose.value)
            .as('observed_carbs'),
        group: sql`FLOOR(EXTRACT (EPOCH FROM SUM(interval_length) OVER (
                         ORDER BY timestamp)) / EXTRACT (EPOCH FROM interval '15 minutes'))`
          .mapWith(glucose.value)
          .as('group'),
      })
      .from(insulin_decay_and_glucose_change)
  )

  // calculate sum of the values over longer time so that values are not so noisy
  const observed_carbs_group_by_time = db
    .$with('observed_carbs_group_by_time')
    .as(
      db
        .with(observed_carbs)
        .select({
          timestamp: sql`MIN(timestamp)`
            .mapWith(glucose.timestamp)
            .as('timestamp'),
          interval_length: sql`SUM(EXTRACT (EPOCH FROM interval_length))`
            .mapWith(glucose.value)
            .as('interval_length'),
          // glucose: sql`glucose`.as('glucose'), best woule be FIRST
          glucose_change: sql`SUM(glucose_change)`
            .mapWith(glucose.value)
            .as('glucose_change'),
          insulin_decay: sql`SUM(insulin_decay)`
            .mapWith(glucose.value)
            .as('insulin_decay'),
          observed_carbs:
            sql`SUM(observed_carbs) / SUM(EXTRACT (EPOCH FROM interval_length)) * EXTRACT (EPOCH FROM interval '15 minutes')`
              .mapWith(glucose.value)
              .as('observed_carbs'),
          // group: sql`group`.as('group'),
        })
        .from(observed_carbs)
        .groupBy(sql`observed_carbs.group`)
    )

  const data = await db
    .with(observed_carbs_group_by_time)
    .select()
    .from(observed_carbs_group_by_time)
    .orderBy(sql`timestamp`)

  // console.log('sql', data.slice(-5))

  return data
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
