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

  const predictions_tf = Statistics.range_timeframe(
    latestBloodGlucose,
    addHours(now, 6)
  )

  const predictions = await Statistics.execute(
    Statistics.predict(
      predictions_tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio,
      latestBloodGlucose
    )
  )

  // const data = await Statistics.execute(
  //   Statistics.observedCarbs(
  //     // Statistics.range_timeframe(subHours(now, 3.1), subHours(now, 0)),
  //     Statistics.carbs_timeframe(user.id, subHours(now, 3.1), subHours(now, 0)),
  //     user.id,
  //     user.carbohydrateRatio,
  //     user.correctionRatio
  //   )
  // )

  // console.log(data)

  // console.log(data.reduce((acc, el) => acc + el.observedCarbs, 0))

  return (
    <BloodGlucose
      bloodGlucoseData={bloodGlucoseData}
      predictions={predictions}
    />
  )
}
