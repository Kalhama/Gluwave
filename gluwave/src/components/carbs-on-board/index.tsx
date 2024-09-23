import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics, calculateUserCarbsData } from '@/lib/sql_utils'
import { observedCarbs } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours, setHours, startOfDay, subHours } from 'date-fns'
import { and, eq, gte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Tuple } from 'victory'

import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
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

  return (
    <CarbsOnBoard
      now={now}
      predicted={predicted}
      observed={observed}
      domain={domain}
    />
  )
}
