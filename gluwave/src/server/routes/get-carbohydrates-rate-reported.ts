import { db } from '@/db'
import { carbs } from '@/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetCarbohydratesRateReportedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const ZGetCarbohydratesRateReportedOutputSchema = z.array(
  z.object({
    timestamp: z.date(),
    rate: z.number(),
  })
)

export const getCarbohydratesRateReported = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydratesRateReportedSchema>>) => {
  return db
    .select({
      timestamp: sql`timeframe.timestamp`
        .mapWith(carbs.timestamp)
        .as('timestamp'),
      rate: sql`COALESCE(SUM(${carbs.amount} / ${carbs.decay}), 0)`
        .mapWith(carbs.amount)
        .as('rate'),
    })
    .from(
      sql`(
      SELECT timestamp 
      FROM carbs
      WHERE user_id = ${user.id}
      AND ${start.toISOString()} <= timestamp 
      AND timestamp <= ${end.toISOString()}

      UNION ALL

      SELECT timestamp + MAKE_INTERVAL(mins => carbs.decay + 1)  AS timestamp
      FROM carbs
      WHERE user_id = ${user.id}
      AND ${start.toISOString()} <= timestamp + MAKE_INTERVAL(mins => carbs.decay) 
      AND timestamp + MAKE_INTERVAL(mins => carbs.decay) <= ${end.toISOString()}
) AS timeframe`
    )
    .leftJoin(
      carbs,
      and(
        eq(carbs.userId, user.id),
        gte(
          sql`${carbs.timestamp} + MAKE_INTERVAL(mins => ${carbs.decay})`,
          sql`timeframe.timestamp`
        ),
        lte(carbs.timestamp, sql`timeframe.timestamp`)
      )
    )
    .groupBy(sql`timeframe.timestamp`)
    .orderBy(sql`timeframe.timestamp`)
}
