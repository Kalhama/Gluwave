import { db } from '@/db'
import { carbs, glucose } from '@/schema'
import { addMinutes, differenceInMinutes, parseISO } from 'date-fns'
import { and, eq, gte, sql } from 'drizzle-orm'

// Function to get safe start time for cob prediction
async function getSafeStartTime(
  inputTime: Date,
  userId: string
): Promise<Date> {
  const [data] = await db
    .select({
      timestamp: sql`max`.mapWith(glucose.timestamp).as('timestamp'),
    })
    .from(
      sql`
(
  WITH timeline AS (
    SELECT 
      -1 AS direction,
      timestamp 
    FROM carbs
    WHERE carbs.user_id = ${userId}
    UNION ALL
    SELECT 
      1 as direction,
      timestamp + MAKE_INTERVAL(mins => (carbs.decay * 1.5)::int) as timestamp 
    FROM carbs
    WHERE carbs.user_id = ${userId}
  ), concurrent AS (
    SELECT
      SUM(direction) OVER (order by timestamp desc rows between unbounded preceding and current row) as overlapping,
      timestamp
    FROM timeline
  ), non_concurrent AS (
    SELECT MAX(timestamp) FROM concurrent
    WHERE overlapping = 0
    AND timestamp < ${inputTime.toISOString()}
  )

  SELECT MAX(timestamp) FROM glucose 
  WHERE timestamp < (SELECT * FROM non_concurrent)
  AND glucose.user_id = ${userId}
)
`
    )

  return data?.timestamp ?? inputTime
}

// Function to check if a meal is active
function isActive(
  ts: Date,
  endTime: Date,
  extendedEndTime: Date,
  attributedCarbs: number,
  carbs: number
): boolean {
  return ts < endTime || (ts < extendedEndTime && attributedCarbs < carbs)
}

// Function to step in time for meal to compare it to
function findComparisonStep(
  datetimes: Date[],
  attributedCarbs: number[],
  lookbackLen: number
): { datetime: Date; attributedCarbs: number } {
  const now = datetimes[0]
  const len = Math.min(attributedCarbs.length, datetimes.length)

  for (let i = 0; i < len; i++) {
    if (differenceInMinutes(now, datetimes[i]) > lookbackLen) {
      return { datetime: datetimes[i], attributedCarbs: attributedCarbs[i] }
    }
  }

  // If no matches, return last
  return {
    datetime: datetimes[len - 1],
    attributedCarbs: attributedCarbs[len - 1],
  }
}

type Meal = {
  carb_id: number
  start: Date
  carbs: number
  decay: number
  extended_decay: number
  attributed_carbs: number[]
}

// attribute observed carbs to meals
export async function attributeObservedToMeals(
  filterUserId: string,
  startTime: Date,
  endTime: Date,
  lookbackLen: number
) {
  const results: {
    carb_id: number
    timestamp: Date
    start: Date
    carbs: number
    decay: number
    extended_decay: number
    attributed_carbs: number
  }[] = []

  const sliceLen = lookbackLen

  let activeMeals: Meal[] = []

  const safeStartTime = await getSafeStartTime(startTime, filterUserId)

  // for every reading in metrics join new_meal entries
  const observations = await db.select({
    glucose_id: sql`glucose_id`.mapWith(glucose.id).as('glucose_id'),
    observed_carbs: sql`observed_carbs`.mapWith(carbs.amount),
    timestamp:
      sql`ARRAY_AGG(metrics.timestamp) OVER (ORDER BY metrics.timestamp DESC ROWS BETWEEN CURRENT ROW AND ${sliceLen} FOLLOWING)`.as<
        Date[]
      >('timestamp'),
    new_meals: sql<Meal[]>`COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
						'carb_id', carbs.id,
						'start', carbs.timestamp,
						'carbs', carbs.amount,
						'decay', carbs.decay,
						'extended_decay', (carbs.decay * 1.5)::int,
						'attributed_carbs', ARRAY[CAST(0 AS DOUBLE PRECISION)]
					)
			    ) FILTER (WHERE carbs.user_id IS NOT NULL), ARRAY[]::jsonb[])`
      .mapWith((value: any) =>
        value.map((value: any) => {
          return {
            ...value,
            start: new Date(value.start),
          }
        })
      )
      .as('new_meals'),
  }).from(sql`
    (SELECT * FROM 
    metrics(${safeStartTime.toISOString()}::timestamp, ${endTime.toISOString()}::timestamp, ${filterUserId})
    ) AS metrics
    
    LEFT JOIN carbs
      ON metrics.user_id = carbs.user_id
      AND metrics.timestamp <= carbs.timestamp AND carbs.timestamp < timestamp_next
      GROUP BY glucose_id, observed_carbs, metrics.timestamp, metrics.user_id
      ORDER BY metrics.timestamp ASC
  `)

  for (const observation of observations) {
    // Filter active meals on current timestamp, no need to attribute carbs into them
    activeMeals = activeMeals.filter((meal) =>
      isActive(
        observation.timestamp[0],
        addMinutes(meal.start, meal.decay),
        addMinutes(meal.start, meal.extended_decay),
        meal.attributed_carbs[0],
        meal.carbs
      )
    )

    // Calculate total rate of active meals
    const totalRate = activeMeals.reduce(
      (sum, meal) => sum + meal.carbs / meal.decay,
      0
    )

    // Attribute observed carbs to each meal
    for (const meal of activeMeals) {
      // meal is pointer, which we want
      const rate = meal.carbs / meal.decay
      let observedAttributedCarbs =
        (rate / totalRate) * observation.observed_carbs +
        meal.attributed_carbs[0]

      const {
        datetime: comparisonTimestamp,
        attributedCarbs: comparisonAttributed,
      } = findComparisonStep(
        observation.timestamp,
        meal.attributed_carbs,
        lookbackLen
      )

      const minAttributedCarbs =
        comparisonAttributed +
        (differenceInMinutes(observation.timestamp[0], comparisonTimestamp) *
          rate) /
          1.5

      const newAttributedCarbs = Math.min(
        Math.max(observedAttributedCarbs, minAttributedCarbs),
        meal.carbs
      )

      meal.attributed_carbs = [
        newAttributedCarbs,
        ...meal.attributed_carbs,
      ].slice(0, sliceLen)
    }

    // Append new meals from this observation step
    activeMeals.push(...observation.new_meals)

    // Push current active meals to result set
    results.push(
      ...activeMeals.map((meal) => ({
        carb_id: meal.carb_id,
        timestamp: observation.timestamp[0],
        start: meal.start,
        carbs: meal.carbs,
        decay: meal.decay,
        extended_decay: meal.extended_decay,
        attributed_carbs: meal.attributed_carbs[0],
      }))
    )
  }

  // return
  return results
}

export const carbs_on_board = async (
  filterUserId: string,
  startTime: Date,
  endTime: Date
) => {
  // get meals with attributed carbs in them
  const attributed = await attributeObservedToMeals(
    filterUserId,
    startTime,
    endTime,
    20
  )

  // calculate single carbs on board value over time
  const cob = Object.values(
    attributed.reduce(
      (acc, cur) => {
        const key = cur.timestamp.toISOString()
        if (!acc[key]) {
          acc[key] = {
            timestamp: cur.timestamp,
            cob: 0,
          }
        }

        acc[key].cob += cur.carbs - cur.attributed_carbs

        return acc
      },
      {} as Record<string, { timestamp: Date; cob: number }>
    )
  )

  return cob
}

export const carbs_on_board_prediction = async (
  filterUserId: string,
  startTime: Date,
  endTime: Date
) => {
  // get meals with attributed carbs in them
  const attributed = await attributeObservedToMeals(
    filterUserId,
    startTime,
    endTime,
    20
  )

  // get largest date
  const max_timestsamp_epoch = Math.max(
    0,
    ...attributed.map((a) => a.timestamp.getTime())
  )
  const max_timestsamp = new Date(
    max_timestsamp_epoch === 0 ? endTime : new Date(max_timestsamp_epoch)
  )

  // get only currently active meals
  const active_meals = attributed
    .filter((a) => a.timestamp.getTime() === max_timestsamp.getTime())
    .map((c) => ({
      timestamp: c.timestamp,
      carbs: c.carbs - c.attributed_carbs,
      rate: Math.max(
        c.carbs / c.extended_decay,
        c.attributed_carbs / differenceInMinutes(c.timestamp, c.start)
      ),
    }))

  // get scheduled meals
  const upcoming_meals = await db
    .select({
      timestamp: carbs.timestamp,
      carbs: carbs.amount,
      rate: sql`${carbs.amount} / ${carbs.decay}`.as<number>('rate'),
    })
    .from(carbs)
    .where(
      and(eq(carbs.userId, filterUserId), gte(carbs.timestamp, max_timestsamp))
    )

  // combine active and scheduled meals
  let meals_for_prediction = [...active_meals, ...upcoming_meals]
  const get_meals_table = () => {
    if (meals_for_prediction.length === 0) {
      return sql`(null::double precision, null::double precision, null::timestamp)`
    } else {
      return sql.join(
        meals_for_prediction.map((a, i) => {
          const last = i === meals_for_prediction.length - 1
          const row =
            sql`(${a.carbs}::double precision, ${a.rate}::double precision, ${a.timestamp.toISOString()}::timestamp)`.append(
              last ? sql`` : sql`,`
            )

          return row
        })
      )
    }
  }

  // calculate predictions
  // Do this in SQL not because it's smart here but because it's smart for glucose prediction
  const predictions = await db
    .select({
      timestamp: sql`timestamp`.mapWith(carbs.timestamp).as('timestamp'),
      cob: sql`	SUM(GREATEST(0, carbs - minutes_between(timestamp, start) * rate))`
        .mapWith(carbs.amount)
        .as('cob'),
    })
    .from(
      sql.join([
        sql`(
    SELECT 
      timeframe.timestamp,
      meals.timestamp as start,
      carbs,
      rate
    FROM generate_series(${max_timestsamp.toISOString()}::timestamp, ${endTime.toISOString()}::timestamp, interval '1 minutes') as timeframe(timestamp)
    LEFT JOIN (
        VALUES 
`,
        get_meals_table(),
        sql`
    ) AS meals(carbs, rate, timestamp) 
    ON timeframe.timestamp >= meals.timestamp
    
        )`,
      ])
    )
    .groupBy(sql`timestamp`)
    .orderBy(sql`timestamp`)

  return predictions
}
