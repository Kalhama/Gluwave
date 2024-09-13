import { db } from '@/db'
import { carbs, glucose, insulin, userTable } from '@/schema'
import { startOfMinute, subHours } from 'date-fns'
import { and, desc, eq, gt, gte, lt, lte, sql } from 'drizzle-orm'

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

  const timestamps = db.$with('timestamps').as(
    db
      .select({
        timestamp: sql`MIN(timestamp)`
          .mapWith(glucose.timestamp)
          .as('timestamp'),
        pool: sql`FLOOR(EXTRACT (EPOCH FROM timestamp) / EXTRACT (EPOCH FROM interval '15 minutes'))`
          .mapWith(glucose.value)
          .as('pool'),
      })
      .from(glucose)
      .where(and(eq(glucose.userId, user.id)))
      .orderBy(sql`timestamp`)
      .groupBy(sql`pool`)
  )

  // calculate cumulative insulin decay for every timestamp
  const cumulative_insulin_decay = db.$with('cumulative_insulin_decay').as(
    db
      .with(timestamps)
      .select({
        timestamp: sql`timestamps.timestamp`
          .mapWith(glucose.timestamp)
          .as('timestamp'),
        cumulative_insulin_decay:
          sql`COALESCE(SUM(((((EXTRACT(EPOCH FROM timestamps.timestamp - insulin.timestamp)/60/55)+1) * EXP(-((EXTRACT(EPOCH FROM timestamps.timestamp - insulin.timestamp)/60/55)))) - 1) * insulin.amount), 0)`.as(
            'cumulative_insulin_decay'
          ),
      })
      .from(timestamps)
      .leftJoin(
        insulin,
        and(
          sql`timestamps.timestamp >= insulin.timestamp`,
          eq(insulin.userId, userId)
        )
      )
      .where(
        and(
          eq(insulin.userId, userId),
          sql`timestamps.timestamp > ${from}`,
          sql`timestamps.timestamp < ${to}`
        )
      )
      .groupBy(sql`timestamps.timestamp`)
      .orderBy(sql`timestamps.timestamp`)
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
            sql`cumulative_insulin_decay.timestamp - LAG(cumulative_insulin_decay.timestamp) OVER (ORDER BY cumulative_insulin_decay.timestamp)`.as(
              'interval_length'
            ),
          glucose: sql`glucose.amount`.as('glucose'),
          glucose_change:
            sql`glucose.amount - LAG(glucose.amount) OVER (ORDER BY cumulative_insulin_decay.timestamp)`.as(
              'glucose_change'
            ),
          insulin_decay:
            sql`cumulative_insulin_decay - LAG(cumulative_insulin_decay) OVER (ORDER BY cumulative_insulin_decay.timestamp)`.as(
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
        interval_length: sql`COALESCE(EXTRACT (EPOCH FROM interval_length), 0)`
          .mapWith(glucose.value)
          .as('interval_length'),
        // glucose: sql`glucose`.mapWith(glucose.value).as('glucose'),
        glucose_change: sql`COALESCE(glucose_change, 0)`
          .mapWith(glucose.value)
          .as('glucose_change'),
        insulin_decay: sql`COALESCE(insulin_decay, 0)`
          .mapWith(glucose.value)
          .as('insulin_decay'),
        observed_carbs:
          sql`COALESCE((glucose_change - insulin_decay * ${user.correctionRatio}) * (${user.carbohydrateRatio / user.correctionRatio}), 0)`
            .mapWith(glucose.value)
            .as('observed_carbs'),
        cumulative_observed_carbs:
          sql`COALESCE(SUM((glucose_change - insulin_decay * ${user.correctionRatio}) * (${user.carbohydrateRatio / user.correctionRatio})) OVER (ORDER BY timestamp), 0)`
            .mapWith(carbs.amount)
            .as('cumulative_observed_carbs'),
        observed_carbs_rate:
          sql`COALESCE((glucose_change - insulin_decay * ${user.correctionRatio}) * (${user.carbohydrateRatio / user.correctionRatio}) / EXTRACT (EPOCH FROM interval_length) * EXTRACT (EPOCH FROM interval '15 minutes'), 0)`
            .mapWith(glucose.value)
            .as('observed_carbs_rate'),
      })
      .from(insulin_decay_and_glucose_change)
  )

  // calculate sum of the values over longer time so that values are not so noisy
  // const observed_carbs_group_by_time = db
  //   .$with('observed_carbs_group_by_time')
  //   .as(
  //     db
  //       .with(observed_carbs)
  //       .select({
  //         timestamp: sql`MIN(timestamp)`
  //           .mapWith(glucose.timestamp)
  //           .as('timestamp'),
  //         interval_length: sql`SUM(EXTRACT (EPOCH FROM interval_length))`
  //           .mapWith(glucose.value)
  //           .as('interval_length'),
  //         // glucose: sql`glucose`.as('glucose'), best woule be FIRST
  //         glucose_change: sql`SUM(glucose_change)`
  //           .mapWith(glucose.value)
  //           .as('glucose_change'),
  //         insulin_decay: sql`SUM(insulin_decay)`
  //           .mapWith(glucose.value)
  //           .as('insulin_decay'),
  //         observed_carbs_rate:
  //           sql`SUM(observed_carbs) / SUM(EXTRACT (EPOCH FROM interval_length)) * EXTRACT (EPOCH FROM interval '15 minutes')`
  //             .mapWith(glucose.value)
  //             .as('observed_carbs_rate'),
  //         observed_carbs: sql`SUM(observed_carbs)`
  //           .mapWith(glucose.value)
  //           .as('observed_carbs'),
  //         // group: sql`group`.as('group'),
  //       })
  //       .from(observed_carbs)
  //       .groupBy(sql`observed_carbs.group`)
  //   )

  const data = await db
    .with(observed_carbs)
    .select()
    .from(observed_carbs)
    .orderBy(sql`timestamp`)

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
      cumulativeDecayedCarbs: sql`sum(
          CASE
              WHEN minutes."timestamp" >= carbs."timestamp" AND minutes."timestamp" < (carbs."timestamp" + MAKE_INTERVAL(mins => carbs.decay)) THEN 
                 "carbs"."amount"::numeric * (EXTRACT(epoch FROM minutes."timestamp" - carbs."timestamp") / 60.0 / carbs.decay)
              WHEN minutes."timestamp" >= (carbs."timestamp" + MAKE_INTERVAL(mins => carbs.decay)) THEN
                carbs.amount
              ELSE 0::numeric
          END)`
        .mapWith(carbs.amount)
        .as('cumulativeDecayedCarbs'),
    })
    .from(minutes)
    .leftJoin(
      carbs,
      and(
        sql`minutes."timestamp" >= carbs."timestamp"`,
        eq(carbs.userId, userId),
        sql`(carbs."timestamp" + MAKE_INTERVAL(mins => carbs.decay)) >= ${from}`
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

export const observed_carbs_per_meal = async (
  start: Date,
  end: Date,
  userId: string,
  ISF: number,
  ICR: number
) => {
  // TODO change timeframe to parameter
  const timeframe = db.$with('timeframe').as(
    db
      .select({
        timestamp: carbs.timestamp,
      })
      .from(carbs)
      .where(
        and(
          eq(carbs.userId, userId),
          gte(carbs.timestamp, start),
          lte(carbs.timestamp, end)
        )
      )
      .union(
        db
          .select({
            timestamp: sql`timestamp + MAKE_INTERVAL(mins => decay)`
              .mapWith(carbs.timestamp)
              .as('timestamp'),
          })
          .from(carbs)
          .where(
            and(
              eq(carbs.userId, userId),
              gte(carbs.timestamp, start),
              lte(carbs.timestamp, end)
            )
          )
      )
      .union(
        db
          .select({
            timestamp: glucose.timestamp,
          })
          .from(glucose)
          .where(eq(glucose.userId, userId))
          .orderBy(desc(glucose.timestamp))
          .limit(1)
      )
  )

  const adjacentGlucoseReadings = db.$with('adjacentGlucoseReadings').as(
    db
      .select({
        value: glucose.value,
        nextValue:
          sql`LEAD(${glucose.value}) OVER (ORDER BY ${glucose.timestamp})`.as(
            'next_value'
          ),
        timestamp: glucose.timestamp,
        nextTimestamp:
          sql`LEAD(${glucose.timestamp}) OVER (ORDER BY ${glucose.timestamp})`.as(
            'next_timestamp'
          ),
      })
      .from(glucose)
      .where(eq(glucose.userId, userId))
  )

  const interpolatedGlucose = db.$with('interpolatedGlucose').as(
    db
      .with(timeframe, adjacentGlucoseReadings)
      .select({
        timestamp: timeframe.timestamp,
        glucose: sql`ANY_VALUE(interpolate_glucose(
          t => ${timeframe.timestamp},
          x1 => ${adjacentGlucoseReadings.timestamp},
          x2 => ${adjacentGlucoseReadings.nextTimestamp},
          y1 => ${adjacentGlucoseReadings.value},
          y2 => ${adjacentGlucoseReadings.nextValue}
        ))`
          .mapWith(adjacentGlucoseReadings.value)
          .as('glucose'),
      })
      .from(timeframe)
      .leftJoin(
        adjacentGlucoseReadings,
        and(
          sql`${adjacentGlucoseReadings.timestamp} < ${timeframe.timestamp}`,
          sql`${adjacentGlucoseReadings.nextTimestamp} >= ${timeframe.timestamp}`
        )
      )
      .groupBy(timeframe.timestamp)
  )

  const aggregatedCarbs = db.$with('aggregatedCarbs').as(
    db
      .with(timeframe)
      .select({
        timestamp: timeframe.timestamp,
        total_carbs_absorbed: sql`COALESCE(SUM(total_carbs_absorbed(
          t => ${timeframe.timestamp}, 
          start => ${carbs.timestamp}, 
          amount => ${carbs.amount}, 
          decay => ${carbs.decay}
        )), 0)`
          .mapWith(carbs.amount)
          .as('total_carbs_absorbed'),
      })
      .from(timeframe)
      .leftJoin(
        carbs,
        and(eq(carbs.userId, userId), lt(carbs.timestamp, timeframe.timestamp))
      )
      .groupBy(timeframe.timestamp)
  )

  const aggregatedInsulin = db.$with('aggregatedInsulin').as(
    db
      .with(timeframe)
      .select({
        timestamp: timeframe.timestamp,
        total_insulin_absorbed: sql`COALESCE(SUM(
          total_insulin_absorbed(
            t => ${timeframe.timestamp},
            start => ${insulin.timestamp},
            amount => ${insulin.amount}
          )
        ), 0)`
          .mapWith(insulin.amount)
          .as('total_insulin_absorbed'),
      })
      .from(timeframe)
      .leftJoin(
        insulin,
        and(
          eq(insulin.userId, userId),
          lt(insulin.timestamp, timeframe.timestamp)
        )
      )
      .groupBy(timeframe.timestamp)
  )

  const metrics = db.$with('metrics').as(
    db
      .with(aggregatedCarbs, aggregatedInsulin, timeframe, interpolatedGlucose)
      .select({
        timestamp: timeframe.timestamp,
        insulin_absorbed:
          sql`${aggregatedInsulin.total_insulin_absorbed} - FIRST_VALUE(${aggregatedInsulin.total_insulin_absorbed}) OVER (ORDER BY ${timeframe.timestamp})`
            .mapWith(insulin.amount)
            .as('insulin_absorbed'),
        carbs_absorbed_predicted:
          sql`${aggregatedCarbs.total_carbs_absorbed} - FIRST_VALUE(${aggregatedCarbs.total_carbs_absorbed}) OVER (ORDER BY ${timeframe.timestamp})`
            .mapWith(carbs.amount)
            .as('carbs_absorbed_predicted'),
        glucose: interpolatedGlucose.glucose,
        observed_carbs: sql`observed_carbs(
          glucose_chnage => LEAD(${interpolatedGlucose.glucose}) OVER (ORDER BY ${timeframe.timestamp}) - ${interpolatedGlucose.glucose},
          insulin_change => ${aggregatedInsulin.total_insulin_absorbed} - LEAD(${aggregatedInsulin.total_insulin_absorbed}) OVER (ORDER BY ${timeframe.timestamp}),
          ISF => ${ISF},
          ICR => ${ICR}
        )`
          .mapWith(carbs.amount)
          .as('observed_carbs'),
      })
      .from(timeframe)
      .leftJoin(
        aggregatedInsulin,
        eq(timeframe.timestamp, aggregatedInsulin.timestamp)
      )
      .leftJoin(
        aggregatedCarbs,
        eq(timeframe.timestamp, aggregatedCarbs.timestamp)
      )
      .leftJoin(
        interpolatedGlucose,
        eq(timeframe.timestamp, interpolatedGlucose.timestamp)
      )
      .orderBy(timeframe.timestamp)
  )

  const observed_carbs_to_meals_per_timestamp = db
    .$with('observed_carbs_to_meals_per_timestamp')
    .as(
      db
        .with(metrics)
        .select({
          timestamp: metrics.timestamp,
          id: sql`COALESCE(carbs.id, -1)`.mapWith(carbs.id).as('id'),

          /* rate divided by total rate times observed carbs*/
          attributed_carbs: sql`COALESCE((${carbs.amount} / ${carbs.decay})
        / 
        (SUM(${carbs.amount} / ${carbs.decay}) OVER (PARTITION BY ${metrics.timestamp})), 1)
        *
        ${metrics.observed_carbs}`
            .mapWith(carbs.amount)
            .as('attributed_carbs'),
        })
        .from(metrics)
        .leftJoin(
          carbs,
          and(
            eq(carbs.userId, userId),
            lte(carbs.timestamp, metrics.timestamp),
            gt(
              sql`${carbs.timestamp} + MAKE_INTERVAL(mins => ${carbs.decay})`,
              metrics.timestamp
            )
          )
        )
    )

  const observed_carbs_per_meal = db.$with('observed_carbs_per_meal').as(
    db
      .with(observed_carbs_to_meals_per_timestamp)
      .select({
        id: observed_carbs_to_meals_per_timestamp.id,
        attributed_carbs:
          sql`SUM(${observed_carbs_to_meals_per_timestamp.attributed_carbs})`
            .mapWith(carbs.amount)
            .as('attributed_carbs'),
      })
      .from(observed_carbs_to_meals_per_timestamp)
      .groupBy(observed_carbs_to_meals_per_timestamp.id)
      .orderBy(observed_carbs_to_meals_per_timestamp.id)
  )

  const data = await db
    .with(observed_carbs_per_meal)
    .select()
    .from(observed_carbs_per_meal)

  console.log(data)

  return data
}
