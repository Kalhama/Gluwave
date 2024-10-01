import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics, Timeframe } from '@/lib/sql_utils'
import { carbs } from '@/schema'
import { addHours, addMinutes, setHours, startOfDay, subHours } from 'date-fns'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Tuple } from 'victory'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbsRateGraph } from './carbohydrate-rate-graph'

/**
 * @returns reported carb rate over time
 */
const getReportedCarbRate = (timeframe: Timeframe, userId: string) => {
  return db
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
}

export default async function CarbsRate() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
  const end = addHours(now, 12)

  const timeframe = Statistics.approximate_timeframe(user.id, start, end)

  const observed = await Statistics.execute(
    Statistics.observed_carbs(
      timeframe,
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

  const reported_rate = await getReportedCarbRate(timeframe, user.id)

  const reportedRate = reported_rate.map((o) => {
    return {
      x: o.timestamp,
      y: o.rate * 15,
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
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrate absorption rate</h2>
        </div>
      </GraphTitle>
      <CarbsRateGraph
        now={now}
        observed={observedRate}
        reported={reportedRate}
        domain={domain}
      />
    </GraphContainer>
  )
}
