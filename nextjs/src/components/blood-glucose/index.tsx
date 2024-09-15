import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours, addMinutes, subHours } from 'date-fns'
import { and, eq, gte } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { BloodGlucose } from './blood-glucose'

export default async function BloodGlucoseProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()

  const bloodGlucoseData = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, user.id),
        gte(glucose.timestamp, subHours(now, 48))
      )
    )
    .orderBy(glucose.timestamp)

  const latestBloodGlucose =
    bloodGlucoseData[bloodGlucoseData.length - 1]?.timestamp ?? now

  const observed_carbbs = await Statistics.carbs_timeframe(
    user.id,
    subHours(latestBloodGlucose, 12),
    addHours(now, 6)
  ).observed_carbs_per_meal(
    user.id,
    user.carbohydrateRatio,
    user.correctionRatio
  )

  const activeCarbs = observed_carbbs.filter(
    (carb) => addMinutes(carb.timestamp, carb.decay) > latestBloodGlucose
  )

  const COB = activeCarbs.reduce(
    (acc, curr) => acc + (curr.carbs - curr.observedCarbs),
    0
  )
  const decay = activeCarbs.reduce((acc, curr) => acc + curr.decay, 0)

  const predictions = await Statistics.range_timeframe(
    latestBloodGlucose,
    addHours(now, 6)
  ).predict(user.id, user.carbohydrateRatio, user.correctionRatio, COB, decay)

  return (
    <BloodGlucose
      bloodGlucoseData={bloodGlucoseData}
      predictions={predictions}
    />
  )
}
