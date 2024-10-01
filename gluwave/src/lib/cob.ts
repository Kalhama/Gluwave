import { db } from '@/db'
import { carbs, glucose } from '@/schema'
import { addHours, addMinutes, differenceInMinutes } from 'date-fns'
import { and, eq, gte, sql } from 'drizzle-orm'

// Function to get safe start time
async function getSafeStartTime(
  inputTime: Date,
  userId: string
): Promise<Date> {
  const data = await db.select({
    timestamp: sql`timestamp`.mapWith(carbs.timestamp),
  }).from(sql`(
    WITH carbs_timeline AS (
        SELECT 
            timestamp,
            -1 AS event_type
        FROM carbs 
        WHERE timestamp < ${inputTime.toISOString()}
        AND user_id = ${userId}
        
        UNION ALL
        
        SELECT 
            timestamp + MAKE_INTERVAL(mins => (decay * 1.5)::int) AS timestamp,
            1 AS event_type
        FROM carbs 
        WHERE timestamp < ${inputTime.toISOString()}
        AND user_id = ${userId}
    ),
    cumulative_carbs AS (
        SELECT 
            timestamp,
            SUM(event_type) OVER (ORDER BY timestamp DESC) AS concurrent
        FROM carbs_timeline
    ),
    last_no_carbs AS (
        SELECT timestamp 
        FROM cumulative_carbs
        WHERE concurrent = 0
        ORDER BY timestamp DESC
        LIMIT 1
    )	
    SELECT timestamp
    FROM metrics 
    WHERE timestamp <= (SELECT timestamp FROM last_no_carbs)
    AND user_id = ${userId}
    ORDER BY timestamp DESC
    LIMIT 1
    )`)

  // TODO if there are no carbs this returns null

  if (!data[0].timestamp) {
    throw new Error('Fatal error could not find safe timestamp for predictions')
  }

  return data[0].timestamp
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

// Function to find comparison step
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

// Main function to attribute observed to meals
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

  let activeMeals: Meal[] = []

  const safeStartTime = await getSafeStartTime(startTime, filterUserId)

  const observations = await db.select({
    glucose_id: sql`glucose_id`.mapWith(glucose.id).as('glucose_id'),
    observed_carbs: sql`observed_carbs`.mapWith(carbs.amount),
    timestamp:
      sql`ARRAY_AGG(metrics.timestamp) OVER (ORDER BY metrics.timestamp DESC ROWS BETWEEN CURRENT ROW AND 20 FOLLOWING)`.as<
        Date[]
      >('timestamp'), // TODO 20 to param?
    new_meals: sql`COALESCE(ARRAY_AGG(
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
        value.map((value: any) => ({
          ...value,
          start: new Date(value.start),
        }))
      )
      .as<Meal[]>('new_meals'),
  }).from(sql`
(
    SELECT 
      *, 
      LEAD(metrics.timestamp) OVER (PARTITION BY user_id ORDER BY metrics.timestamp) AS next_timestamp 
    FROM metrics
  ) AS metrics
  LEFT JOIN carbs
  ON metrics.user_id = carbs.user_id
  AND metrics.timestamp <= carbs.timestamp AND carbs.timestamp < next_timestamp
  WHERE metrics.user_id = ${filterUserId}
  AND ${safeStartTime.toISOString()} <= metrics.timestamp AND metrics.timestamp <= ${endTime.toISOString()}
  GROUP BY glucose_id, observed_carbs, metrics.timestamp, metrics.user_id
  ORDER BY metrics.timestamp ASC
		
    `)

  for (const observation of observations) {
    // Filter active meals on current timestamp
    activeMeals = activeMeals.filter((meal) =>
      isActive(
        observation.timestamp[0],
        addMinutes(meal.start, meal.decay),
        addMinutes(meal.start, meal.extended_decay),
        meal.attributed_carbs[0],
        meal.carbs
      )
    )

    // Calculate total rate
    const totalRate = activeMeals.reduce(
      (sum, meal) => sum + meal.carbs / meal.decay,
      0
    )

    // Attribute carbs to each meal
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
      ].slice(0, 20) // TODO slice amount to param?
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

  return results
}

export const carbs_on_board = async (
  filterUserId: string,
  startTime: Date,
  endTime: Date
) => {
  const attributed = await attributeObservedToMeals(
    filterUserId,
    startTime,
    endTime,
    20
  )

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
  const attributed = await attributeObservedToMeals(
    filterUserId,
    startTime,
    endTime,
    20
  )

  const max_timestsamp = new Date(
    Math.max(...attributed.map((a) => a.timestamp.getTime()))
  ) // get largest date

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

  const meals_for_prediction = [...active_meals, ...upcoming_meals]

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
    FROM generate_series(${max_timestsamp.toISOString()}::timestamp, ${addHours(max_timestsamp, 6).toISOString()}::timestamp, interval '1 minutes') as timeframe(timestamp)
    LEFT JOIN (
        VALUES 
`,
        ...meals_for_prediction.map((a, i) => {
          const last = i === meals_for_prediction.length - 1
          const row =
            sql`(${a.carbs}::double precision, ${a.rate}::double precision, ${a.timestamp.toISOString()}::timestamp)`.append(
              last ? sql`` : sql`,`
            )

          return row
        }),
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
