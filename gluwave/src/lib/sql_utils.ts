import { db } from '@/db'
import { carbs, glucose, insulin, userTable } from '@/schema'
import { startOfMinute, subHours } from 'date-fns'
import {
  ColumnsSelection,
  SQL,
  and,
  desc,
  eq,
  gt,
  gte,
  lt,
  lte,
  sql,
} from 'drizzle-orm'
import {
  PgColumn,
  WithSubqueryWithSelection,
  timestamp,
} from 'drizzle-orm/pg-core'
import { Query } from 'pg'

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
   * @returns Meals and adds amount of observed carbs to each meal.
   *
   * Warning: The function might return meals outside specified in timeframe selection if they had effect during the timeframe
   * Warning: If there is no observed carbs on some time period used then observed carbs might be too low
   */
  public static observed_carbs_per_meal(
    timeframe: Timeframe,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const observedCarbs = Statistics.observed_carbs(timeframe, userId, ISF, ICR)

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

    const observed_carbs_per_meal = db.$with('observed_carbs_per_meal').as(
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

    return observed_carbs_per_meal
  }

  /**
   * @returns Glucose over time, values are interpolated linearly to the timeframe if needed
   */
  public static interpolated_glucose(timeframe: Timeframe, userId: string) {
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

    const interpolated_glucose = db.$with('interpolated_glucose').as(
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

    return interpolated_glucose
  }

  /**
   * @returns Total absorbed insulin cumulatively over time
   */
  public static cumulative_insulin(timeframe: Timeframe, userId: string) {
    const cumulative_insulin = db.$with('cumulative_insulin').as(
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

    return cumulative_insulin
  }

  /**
   * @returns cumulative absorbed carbs as they were reported
   */
  public static cumulative_reported_absorbed_carbs(
    timeframe: Timeframe,
    userId: string
  ) {
    const cumulative_reported_absorbed_carbs = db
      .$with('cumulative_reported_absorbed_carbs')
      .as(
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
    return cumulative_reported_absorbed_carbs
  }

  /**
   * @returns observed carbs based on glucose changes and insulin decay
   */
  public static observed_carbs(
    timeframe: Timeframe,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const interpolatedGlucose = Statistics.interpolated_glucose(
      timeframe,
      userId
    )
    const cumulativeInsulin = Statistics.cumulative_insulin(timeframe, userId)

    const observed_carbs = db.$with('observed_carbs').as(
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
          interval:
            sql`EXTRACT (epoch FROM LEAD(${timeframe.timestamp}) OVER (ORDER BY ${timeframe.timestamp}) - ${timeframe.timestamp})`
              .mapWith(carbs.amount)
              .as('interval'),
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

    return observed_carbs
  }

  /**
   * @returns prediction of glucose based on future insulin and carbohydrates on board
   */
  public static predict_glucose(
    start: Date,
    end: Date,
    userId: string,
    ISF: number,
    ICR: number
  ) {
    const range_tf = Statistics.range_timeframe(start, end)
    const cumulativeInsulin = Statistics.cumulative_insulin(range_tf, userId)

    const carbs_tf = Statistics.carbs_timeframe(
      userId,
      subHours(start, 12), // make sure that we catch all observed carbs on currently active meals
      end
    )
    const carbs_observed = Statistics.observed_carbs_per_meal(
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
          and(
            gte(range_tf.timestamp, carbs_observed.timestamp),
            sql`${carbs_observed.timestamp} + MAKE_INTERVAL(mins => ${carbs_observed.decay}) >= ${start.toISOString()}::timestamp` // esxclude carbs that are not active
          )
        )
        .groupBy(range_tf.timestamp)
        .orderBy(range_tf.timestamp)
    )

    const cte = db.$with('predict_glucose').as(
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

  /**
   * @returns reported carb rate over time
   */
  public static reported_carb_rate(timeframe: Timeframe, userId: string) {
    const cte = db.$with('reported_carb_rate').as(
      db
        .with(timeframe)
        .select({
          timestamp: timeframe.timestamp,
          rate: sql`COALESCE(SUM(${carbs.amount} / ${carbs.decay}), 0)`
            .mapWith(carbs.amount)
            .as('rate'),
        })
        .from(timeframe)
        .leftJoin(
          carbs,
          and(
            eq(carbs.userId, userId),
            gte(
              sql`${carbs.timestamp} + MAKE_INTERVAL(mins => ${carbs.decay})`,
              timeframe.timestamp
            ),
            lte(carbs.timestamp, timeframe.timestamp)
          )
        )
        .groupBy(timeframe.timestamp)
        .orderBy(timeframe.timestamp)
    )

    return cte
  }

  /**
   * @returns carbs on board after reducing amount of carbs observed
   */
  public static async observed_carbs_on_board(
    userId: string,
    ISF: number,
    ICR: number,
    start: Date,
    end: Date
  ) {
    const timeframe = Statistics.range_timeframe(start, end, 1)
    const observed_carbs = Statistics.observed_carbs(
      timeframe,
      userId,
      ISF,
      ICR
    )

    const base = db.$with('base').as(
      db
        .with(timeframe, observed_carbs)
        .select({
          timestamp: sql`${timeframe.timestamp}`
            .mapWith(timeframe.timestamp)
            .as('timestamp'),
          id: carbs.id,
          decay: carbs.decay,
          amount: carbs.amount,
          start: sql`${carbs.timestamp}`.mapWith(carbs.timestamp).as('start'),
          end: sql`${carbs.timestamp} + MAKE_INTERVAL(mins => ${carbs.decay})`
            .mapWith(carbs.timestamp)
            .as('end'),
          rate: sql`1.0 * amount / decay`.mapWith(carbs.amount).as('rate'),
          min_rate: sql`1.0 * amount / decay / 1.5`
            .mapWith(carbs.amount)
            .as('min_rate'),
          observed: sql`${observed_carbs.observedCarbs}`
            .mapWith(carbs.amount)
            .as('observed'),
        })
        .from(timeframe)
        .leftJoin(
          carbs,
          and(eq(carbs.userId, userId), gte(carbs.timestamp, start))
        )
        .leftJoin(
          observed_carbs,
          and(eq(timeframe.timestamp, observed_carbs.timestamp))
        )
    )

    // console.log((await db.with(base).select().from(base)).slice(-100))
    // return

    const min_rate_lookback_period = 20

    const attributed_carbs = db
      .with(base)
      .select({
        timestamp: sql`timestamp`.mapWith(carbs.timestamp).as('timestamp'),
        // id: sql`id`,
        // min_rate: sql`min_rate`,
        // start: sql`start`,
        // amount: sql`amount`,
        // observed: sql`observed`,
        // cumulative_attributed: sql`cumulative_attributed_last`,
        // activee: sql`activee`,
        carbs_on_board: sql`carbs_on_board`,
      })
      .from(
        sql`(with recursive attributed_carbs as (
            SELECT 
              timestamp, 
              id, 
              start, 
              min_rate, 
              amount, 
              observed,
              ARRAY[COALESCE(observed * min_rate / NULLIF(SUM(active::int * min_rate) OVER (), 0), 0)] AS cumulative_attributed,
              active
            FROM base,
            LATERAL (
              SELECT timestamp > base.start AND timestamp < base.end as active
            )
            WHERE timestamp = (
              SELECT timestamp FROM base ORDER BY timestamp LIMIT 1
            )
            
            
            UNION ALL
            
            SELECT 
              c.timestamp,
              c.id,
              c.start,
              c.min_rate,
              c.amount,
              c.observed,
              -- store previous values in array, so we can check if they are absorbing too slow
              (array_prepend(CASE WHEN p.active THEN
                -- wer're calculating carbs on board, so cap the amount to reported
                LEAST(
                  c.amount,
                  GREATEST(
                    p.cumulative_attributed[1] + GREATEST(
                      CASE 
                        -- When decay has been too slow increase minimum attribution
                        WHEN (p.cumulative_attributed[1] - p.cumulative_attributed[array_length(p.cumulative_attributed, 1)] < c.min_rate * (array_length(p.cumulative_attributed, 1)))
                        THEN c.min_rate
                        ELSE null
                      END, 
                      c.observed * c.min_rate / SUM (p.active::int * c.min_rate) OVER ()
                    ),
                    0
                  )
                )
              ELSE
                p.cumulative_attributed[1]
              END, p.cumulative_attributed))[1:${min_rate_lookback_period}] AS cumulative_attributed,
              l.active
            FROM base c
            INNER JOIN attributed_carbs p ON p.timestamp + INTERVAL '1 minute' = c.timestamp AND p.id = c.id,
            LATERAL (
              SELECT c.timestamp > c.start AND (c.timestamp < c.end OR (p.cumulative_attributed[1] < c.amount AND c.timestamp < c.end + MAKE_INTERVAL(mins => (c.decay / 2)::int))) AS active
            ) as l
        )
            -- SELECT *, cumulative_attributed[1] as cumulative_attributed_last FROM attributed_carbs ORDER BY timestamp
            SELECT 
            timestamp, 
            COALESCE(SUM(amount - cumulative_attributed[1]) FILTER (WHERE start < timestamp), 0) 
            as carbs_on_board 
            FROM attributed_carbs 
            GROUP BY timestamp 
            ORDER BY timestamp 
        )`
      )

    return attributed_carbs
  }

  /**
   * @returns timeframe of every time meal starts or ends, as well as lates glucose reading
   */
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

  /**
   *
   * @param step in minutes
   * @returns timeframe with one minute step
   */
  public static range_timeframe(start: Date, end: Date, step = 1) {
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
              sql`generate_series(${startOfMinute(start).toISOString()}::timestamp, ${startOfMinute(end).toISOString()}::timestamp, MAKE_INTERVAL(mins => ${step})) as timestamp`
            )
        )
    )

    return tf
  }

  /**
   * @returns timeframe of roughly 15 minute step aligning to glucose readings (ie. for every timestamp there will be a glucose reading)
   */
  public static approximate_timeframe(userId: string, start: Date, end: Date) {
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
              timestamp: sql`min(${glucose.timestamp})`
                .mapWith(glucose.timestamp)
                .as('timestamp'),
            })
            .from(glucose)
            .where(
              and(
                eq(glucose.userId, userId),
                gte(glucose.timestamp, start),
                lte(glucose.timestamp, end)
              )
            )

            .groupBy(
              sql`FLOOR(EXTRACT (EPOCH FROM glucose.timestamp) / EXTRACT (EPOCH FROM interval '15 minutes'))`
            )
        )
    )

    return tf
  }

  /**
   * @returns selects and returns given CTE (common table expression)
   */
  public static execute<T extends ColumnsSelection, K extends string>(
    cte: WithSubqueryWithSelection<T, K>
  ) {
    const query = db.with(cte).select().from(cte)
    // console.log(query.toSQL())
    return query
  }
}
