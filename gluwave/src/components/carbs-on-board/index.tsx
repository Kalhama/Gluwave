import { validateRequest } from '@/auth'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { observedCarbs } from '@/lib/sql_utils'
import { addHours, addMinutes, setHours, startOfDay, subHours } from 'date-fns'
import { redirect } from 'next/navigation'
import { Tuple } from 'victory'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbsOnBoardContent } from './carbs-on-board-content'

export default async function CarbsOnBoard() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
  const end = addHours(now, 6)

  const observed = await observedCarbs(start, end, user.id)
  const predicted = await calculateUserCarbsData(start, end, user.id)

  const domain = {
    y: [
      Math.min(
        ...predicted.map((c) => c.cumulativeDecayedCarbs),
        ...observed.map((c) => c.cumulative_observed_carbs)
      ),
      Math.max(
        ...predicted.map((c) => c.cumulativeDecayedCarbs),
        ...observed.map((c) => c.cumulative_observed_carbs)
      ) + 10,
    ] as Tuple<number>,
    x: [start, end] as Tuple<Date>,
  }

  const current = predicted.find(
    (c) => now < c.timestamp && addMinutes(now, 1) >= c.timestamp
  )

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">
            Observed and predicted carbohydrates
          </h2>
          <span className="text-xs">
            COB{' '}
            {current?.carbsOnBoard.toLocaleString(undefined, {
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
      <CarbsOnBoardContent
        now={now}
        predicted={predicted}
        observed={observed}
        domain={domain}
      />
    </GraphContainer>
  )
}
