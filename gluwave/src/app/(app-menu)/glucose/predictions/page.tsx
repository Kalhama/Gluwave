import { validateRequest } from '@/auth'
import { AdjustGlucosePrediction } from '@/components/blood-glucose-prediction/adjust-glucose-prediction'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours, subHours } from 'date-fns'
import { and, eq, gte, lte } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Gluwave - Predictions',
}
const getGlucose = async (userId: string, from: Date, to: Date) => {
  const bloodGlucoseData = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, userId),
        gte(glucose.timestamp, from),
        lte(glucose.timestamp, to)
      )
    )
    .orderBy(glucose.timestamp)

  return bloodGlucoseData
}

export default async function Predictions() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()

  const glucose = await getGlucose(
    user.id,
    subHours(now, 24),
    addHours(now, 24)
  )

  const lastBloodGlucose = glucose[glucose.length - 1]

  const predictions = await Statistics.execute(
    Statistics.predict_glucose(
      lastBloodGlucose.timestamp ?? now,
      addHours(now, 6),
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  return (
    <div className="mt-2 mx-auto max-w-2xl min-[420px]:px-2 md:px-4 space-y-6">
      <AdjustGlucosePrediction
        now={now}
        glucose={glucose}
        prediction={predictions}
        lastBloodGlucose={lastBloodGlucose.value}
      />
    </div>
  )
}
