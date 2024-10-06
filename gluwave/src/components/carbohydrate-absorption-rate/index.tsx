import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
import { carbs } from '@/schema'
import { addHours, setHours, startOfDay, subHours } from 'date-fns'
import { and, eq, gte, lt, lte, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Tuple } from 'victory'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbohydrateAbsorptionRateGraph } from './carbohydrate-absorption-rate-graph'

interface Props {
  href?: string
}

/**
 * @returns reported carb rate over time
 */
const getReportedCarbRate = (userId: string, start: Date, end: Date) => {
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
      WHERE user_id = ${userId}
      AND ${start.toISOString()} <= timestamp 
      AND timestamp <= ${end.toISOString()}

      UNION ALL

      SELECT timestamp + MAKE_INTERVAL(mins => carbs.decay + 1)  AS timestamp
      FROM carbs
      WHERE user_id = ${userId}
      AND ${start.toISOString()} <= timestamp + MAKE_INTERVAL(mins => carbs.decay) 
      AND timestamp + MAKE_INTERVAL(mins => carbs.decay) <= ${end.toISOString()}
) AS timeframe`
    )
    .leftJoin(
      carbs,
      and(
        eq(carbs.userId, userId),
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

export default async function CarbohydrateAbsorptionRate({ href }: Props) {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
  const end = addHours(now, 12)

  const tf = Statistics.approximate_timeframe(user.id, start, end)

  const observed = await Statistics.execute(
    Statistics.observed_carbs(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  const observedRate = observed.map((o) => {
    return {
      x: o.timestamp,
      y: (o.observedCarbs / (o.interval ?? 1)) * (15 * 60),
    }
  })
  const d = await db.execute(sql`SELECT timestamp 
    FROM carbs
      WHERE timestamp <= ${end.toISOString()}`)

  const reported_rate = await getReportedCarbRate(user.id, start, end)

  const reportedRate = reported_rate.map((o) => {
    return {
      x: o.timestamp,
      y: o.rate * 15, // bring to same scale with observed
    }
  })

  const domain = {
    y: [
      Math.min(
        ...observedRate.map((c) => c.y),
        ...reportedRate.map((c) => c.y)
      ) - 1,
      Math.max(
        ...observedRate.map((c) => c.y),
        ...reportedRate.map((c) => c.y)
      ) + 1,
    ] as Tuple<number>,
    x: [start, end] as Tuple<Date>,
  }

  return (
    <GraphContainer>
      <GraphTitle href={href} className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrate absorption rate</h2>
          <span className="text-xs text-slate-600">~15 min period</span>
        </div>
      </GraphTitle>
      <CarbohydrateAbsorptionRateGraph
        now={now}
        observed={observedRate}
        reported={reportedRate}
        domain={domain}
      />
    </GraphContainer>
  )
}
