import { validateRequest } from '@/auth'
import { Statistics } from '@/lib/sql_utils'
import { addHours, addMinutes, setHours, startOfDay, subHours } from 'date-fns'
import { redirect } from 'next/navigation'
import { Tuple } from 'victory'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbsRateGraph } from './carbohydrate-rate-graph'

export default async function CarbsRate() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
  const end = addHours(now, 12)

  const tf = Statistics.approximate_timeframe(user.id, start, end)

  const observed = await Statistics.execute(
    Statistics.observedCarbs(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  const reported = await Statistics.execute(
    Statistics.reported_carb_rate(tf, user.id)
  )

  const observedRate = observed.map((o) => {
    return {
      x: o.timestamp,
      y: (o.observedCarbs / (o.interval ?? 1)) * (15 * 60),
    }
  })

  const reportedRate = reported.map((o) => {
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
