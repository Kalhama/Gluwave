import { validateRequest } from '@/auth'
import { db } from '@/db'
import { getData2 } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours, subHours } from 'date-fns'
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

  // const carbs = await Statistics.carbs_timeframe(
  //   user.id,
  //   subHours(now, 12),
  //   now
  // ).observed_carbs_per_meal(
  //   user.id,
  //   user.carbohydrateRatio,
  //   user.correctionRatio
  // )

  // const activeCarbs = carbs.filter(
  //   (carb) => addMinutes(carb.timestamp, carb.decay) > now
  // )
  // const COB = activeCarbs.reduce(
  //   (acc, curr) => acc + (curr.carbs - curr.observedCarbs),
  //   0
  // )
  // const rate = activeCarbs.reduce(
  //   (acc, curr) => acc + curr.carbs / curr.decay,
  //   0
  // )

  // const predictions = await Statistics.range_timeframe(
  //   latestBloodGlucose,
  //   addHours(now, 6),
  //   1
  // ).predict(user.id, user.carbohydrateRatio, user.correctionRatio, COB, rate)

  const predictionData2 = await getData2(
    latestBloodGlucose,
    addHours(latestBloodGlucose, 9),
    user.id
  )

  return (
    <BloodGlucose
      bloodGlucoseData={bloodGlucoseData}
      predictionData2={predictionData2}
    />
  )
}
