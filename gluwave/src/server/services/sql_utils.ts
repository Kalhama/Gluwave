import { db } from '@/db'
import { carbs, glucose, insulin } from '@/schema'
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

export type Timeframe = WithSubqueryWithSelection<
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
  public static attributed_carbs_simple(
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
