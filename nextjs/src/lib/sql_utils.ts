import { db } from '@/db'
import { carbs, glucose, insulin, userTable } from '@/schema'
import { startOfMinute } from 'date-fns'
import {
  ColumnsSelection,
  and,
  desc,
  eq,
  gt,
  gte,
  lt,
  lte,
  sql,
} from 'drizzle-orm'
import { PgColumn, WithSubqueryWithSelection } from 'drizzle-orm/pg-core'

// TODO remove / use Statistics class
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

// TODO remove / use Statistics class
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

// TODO remove / use Statistics class
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

type Timeframe = WithSubqueryWithSelection<
  {
    timestamp: PgColumn<
      {
        name: 'timestamp'
        tableName: string
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: boolean
        isPrimaryKey: boolean
        generated: undefined
        isAutoincrement: boolean
        hasRuntimeDefault: boolean
        enumValues: any
      },
      {},
      {}
    >
  },
  'timeframe'
>

export class Statistics {
  /**
   * The function might return meals earlier than specified in timeframe selection
   *
   * If there is no observed carbs on some time period used then observed carbs might be too low
   */
  public static observedCarbsPerMeal(
    timeframe: Timeframe,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const observedCarbs = Statistics.observedCarbs(timeframe, userId, ISF, ICR)

    const observedCarbsPerMealPerTimestamp = db
      .$with('observedCarbsPerMealPerTimestamp')
      .as(
        db
          .with(observedCarbs)
          .select({
            timestamp: observedCarbs.timestamp,
            id: sql`COALESCE(carbs.id, -1)`.mapWith(carbs.id).as('id'),

            /* rate divided by total rate times observed carbs*/
            observedCarbs: sql`COALESCE((${carbs.amount} / ${carbs.decay})
              / 
              (SUM(${carbs.amount} / ${carbs.decay}) OVER (PARTITION BY ${observedCarbs.timestamp})), 1)
              *
              ${observedCarbs.observedCarbs}`
              .mapWith(carbs.amount)
              .as('observedCarbs'),
            carbs: carbs.amount,
            carbsTimestamp: sql`carbs.timestamp`
              .mapWith(carbs.timestamp)
              .as('carbsTimestamp'),
            decay: carbs.decay,
          })
          .from(observedCarbs)
          .leftJoin(
            carbs,
            and(
              eq(carbs.userId, userId),
              lte(carbs.timestamp, observedCarbs.timestamp),
              gt(
                sql`${carbs.timestamp} + MAKE_INTERVAL(mins => ${carbs.decay})`,
                observedCarbs.timestamp
              )
            )
          )
      )

    const observedCarbsPerMeal = db.$with('observedCarbsPerMeal').as(
      db
        .with(observedCarbsPerMealPerTimestamp)
        .select({
          id: observedCarbsPerMealPerTimestamp.id,
          carbs: sql`ANY_VALUE(${observedCarbsPerMealPerTimestamp.carbs})`
            .mapWith(carbs.amount)
            .as('carbs'),
          timestamp:
            sql`ANY_VALUE(${observedCarbsPerMealPerTimestamp.carbsTimestamp})`
              .mapWith(carbs.timestamp)
              .as('carbsTimestamp'),
          observedCarbs:
            sql`SUM(${observedCarbsPerMealPerTimestamp.observedCarbs})`
              .mapWith(carbs.amount)
              .as('observedCarbs'),
          decay: sql`ANY_VALUE(${observedCarbsPerMealPerTimestamp.decay})`
            .mapWith(carbs.decay)
            .as('decay'),
        })
        .from(observedCarbsPerMealPerTimestamp)
        .groupBy(observedCarbsPerMealPerTimestamp.id)
        .orderBy(observedCarbsPerMealPerTimestamp.id)
    )

    return observedCarbsPerMeal
  }

  public static interpolatedGlucose(timeframe: Timeframe, userId: string) {
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
            lt(adjacentGlucoseReadings.timestamp, timeframe.timestamp),
            gte(adjacentGlucoseReadings.nextTimestamp, timeframe.timestamp)
          )
        )
        .groupBy(timeframe.timestamp)
    )

    return interpolatedGlucose
  }

  public static cumulativeInsulin(timeframe: Timeframe, userId: string) {
    const cumulativeInsulin = db.$with('cumulativeInsulin').as(
      db
        .with(timeframe)
        .select({
          timestamp: timeframe.timestamp,
          cumulativeInsulin: sql`COALESCE(SUM(
            total_insulin_absorbed(
              t => ${timeframe.timestamp},
              start => ${insulin.timestamp},
              amount => ${insulin.amount}
            )
          ), 0)
           - FIRST_VALUE(COALESCE(SUM(
            total_insulin_absorbed(
              t => ${timeframe.timestamp},
              start => ${insulin.timestamp},
              amount => ${insulin.amount}
            )
          ), 0)) OVER (ORDER BY ${timeframe.timestamp})
          `
            .mapWith(insulin.amount)
            .as('cumulativeInsulin'),
        })
        .from(timeframe)
        .leftJoin(
          insulin,
          and(
            eq(insulin.userId, userId),
            lt(insulin.timestamp, timeframe.timestamp)
            // lt(sql`LEAST(timeframe.timestamp) - interval '12 hours`, insulin.timestamp) with or without?
          )
        )
        .groupBy(timeframe.timestamp)
    )

    return cumulativeInsulin
  }

  public static cumulativeCarbs(timeframe: Timeframe, userId: string) {
    const cumulativeCarbs = db.$with('cumulativeCarbs').as(
      db
        .with(timeframe)
        .select({
          timestamp: timeframe.timestamp,
          predictedCarbs: sql`COALESCE(SUM(total_carbs_absorbed(
            t => ${timeframe.timestamp}, 
            start => ${carbs.timestamp}, 
            amount => ${carbs.amount}, 
            decay => ${carbs.decay}
          )), 0)
           - FIRST_VALUE(COALESCE(SUM(total_carbs_absorbed(
            t => ${timeframe.timestamp}, 
            start => ${carbs.timestamp}, 
            amount => ${carbs.amount}, 
            decay => ${carbs.decay}
          )), 0)) OVER (ORDER BY ${timeframe.timestamp})
          `
            .mapWith(carbs.amount)
            .as('predictedCarbs'),
        })
        .from(timeframe)
        .leftJoin(
          carbs,
          and(
            eq(carbs.userId, userId),
            lt(carbs.timestamp, timeframe.timestamp)
            // lt(sql`LEAST(timeframe.timestamp) - interval '12 hours'`, carbs.timestamp) with or without?
          )
        )
        .groupBy(timeframe.timestamp)
    )
    return cumulativeCarbs
  }

  public static observedCarbs(
    timeframe: Timeframe,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const interpolatedGlucose = Statistics.interpolatedGlucose(
      timeframe,
      userId
    )
    const cumulativeInsulin = Statistics.cumulativeInsulin(timeframe, userId)

    const observedCarbs = db.$with('observedCarbs').as(
      db
        .with(cumulativeInsulin, timeframe, interpolatedGlucose)
        .select({
          timestamp: timeframe.timestamp,
          glucose: interpolatedGlucose.glucose,
          cumulativeInsulin: cumulativeInsulin.cumulativeInsulin,

          // If there is no glucose_change, there is no observed_carbs, which is correct behavior
          observedCarbs: sql`observed_carbs(
            glucose_chnage => LEAD(${interpolatedGlucose.glucose}) OVER (ORDER BY ${timeframe.timestamp}) - ${interpolatedGlucose.glucose},
            insulin_change => LEAD(${cumulativeInsulin.cumulativeInsulin}) OVER (ORDER BY ${timeframe.timestamp}) - ${cumulativeInsulin.cumulativeInsulin},
            ISF => ${ISF},
            ICR => ${ICR}
          )`
            .mapWith(carbs.amount)
            .as('observedCarbs'),
        })
        .from(timeframe)
        .leftJoin(
          cumulativeInsulin,
          eq(cumulativeInsulin.timestamp, timeframe.timestamp)
        )
        .leftJoin(
          interpolatedGlucose,
          eq(interpolatedGlucose.timestamp, timeframe.timestamp)
        )
        .orderBy(timeframe.timestamp)
    )

    return observedCarbs
  }

  public static predict(
    start: Date,
    end: Date,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const range_tf = Statistics.range_timeframe(start, end)
    const cumulativeInsulin = Statistics.cumulativeInsulin(range_tf, userId)

    const carbs_tf = Statistics.carbs_timeframe(userId, start, end)
    const carbs_observed = Statistics.observedCarbsPerMeal(
      carbs_tf,
      userId,
      ISF,
      ICR
    )

    const predictedCarbs = db.$with('predicted_carbs').as(
      db
        .with(range_tf, carbs_observed)
        .select({
          timestamp: range_tf.timestamp,
          // don't really like how we come up with decay but whatever
          predicted_carbs: sql`SUM(
            total_carbs_absorbed(
              t => ${range_tf.timestamp},
              start => GREATEST(${start.toISOString()}::timestamp, ${carbs_observed.timestamp}),
              amount => (GREATEST(${carbs_observed.carbs} - ${carbs_observed.observedCarbs}, 0))::integer,
              decay => ((GREATEST(${carbs_observed.carbs} - ${carbs_observed.observedCarbs}, 0)) / (${carbs_observed.carbs} / ${carbs_observed.decay}))::integer
            )
          )`
            .mapWith(carbs.amount)
            .as('carbEffect'),
        })
        .from(range_tf)
        .leftJoin(
          carbs_observed,
          and(gte(range_tf.timestamp, carbs_observed.timestamp))
        )
        .groupBy(range_tf.timestamp)
        .orderBy(range_tf.timestamp)
    )

    const cte = db.$with('predict').as(
      db
        .with(predictedCarbs, cumulativeInsulin)
        .select({
          timestamp: predictedCarbs.timestamp,
          carbEffect: sql`${predictedCarbs.predicted_carbs} / ${ISF} * ${ICR}`
            .mapWith(glucose.value)
            .as('carbEffect'),
          insulinEffect:
            sql`${cumulativeInsulin.cumulativeInsulin} * ${ICR} * -1`
              .mapWith(glucose.value)
              .as('insulinEffect'),
          totalEffect:
            sql`(${predictedCarbs.predicted_carbs} / ${ISF} * ${ICR}) + (${cumulativeInsulin.cumulativeInsulin} * ${ICR} * -1)`
              .mapWith(glucose.value)
              .as('totalEffect'),
        })
        .from(predictedCarbs)
        .leftJoin(
          cumulativeInsulin,
          eq(cumulativeInsulin.timestamp, predictedCarbs.timestamp)
        )
    )

    return cte
  }

  public static carbs_timeframe(userId: string, start: Date, end: Date) {
    const tf = db.$with('timeframe').as(
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
                gte(sql`timestamp + MAKE_INTERVAL(mins => decay)`, start),
                lte(sql`timestamp + MAKE_INTERVAL(mins => decay)`, end)
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

    return tf
  }

  public static range_timeframe(start: Date, end: Date) {
    /* need to use a real table where we union the series, because otherwise tf.timestamp will refer to timestamp, not timeframe.timestamp */
    const tf = db.$with('timeframe').as(
      db
        .select({
          timestamp: carbs.timestamp,
        })
        .from(carbs)
        .limit(0)
        .union(
          db
            .select({
              timestamp: sql`timestamp`
                .mapWith(glucose.timestamp)
                .as('timestamp'),
            })
            .from(
              sql`generate_series(${startOfMinute(start).toISOString()}::timestamp, ${startOfMinute(end).toISOString()}::timestamp, interval '1 minutes') as timestamp`
            )
        )
    )

    return tf
  }

  public static execute<T extends ColumnsSelection, K extends string>(
    cte: WithSubqueryWithSelection<T, K>
  ) {
    const query = db.with(cte).select().from(cte)
    return query
  }
}
