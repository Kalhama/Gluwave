import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
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

  const predictions = await Statistics.execute(
    Statistics.predict(
      latestBloodGlucose,
      addHours(now, 6),
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  return (
    <BloodGlucose
      now={now}
      bloodGlucoseData={bloodGlucoseData}
      predictions={predictions}
    />
  )
}
