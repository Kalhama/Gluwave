import { validateRequest } from '@/auth'
import { db } from '@/db'
import { getData2 } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours } from 'date-fns'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { BloodGlucose } from './blood-glucose'

export default async function BloodGlucoseProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const bloodGlucoseData = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(eq(glucose.userId, user.id))
    .orderBy(glucose.timestamp)

  const latestBloodGlucose =
    bloodGlucoseData[bloodGlucoseData.length - 1]?.timestamp ?? new Date()

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
