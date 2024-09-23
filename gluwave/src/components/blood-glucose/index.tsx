import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
import { glucose } from '@/schema'
import { addHours, subHours } from 'date-fns'
import { and, eq, gte, lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { BloodGlucoseContent } from './blood-glucose-content'

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

export default async function BloodGlucose() {
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
    Statistics.predict(
      lastBloodGlucose.timestamp ?? now,
      addHours(now, 6),
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  const eventually =
    lastBloodGlucose.value ??
    0 -
      predictions[0]?.totalEffect +
      predictions[predictions.length - 1]?.totalEffect

  return (
    <GraphContainer>
      <GraphTitle href="/glucose/list">
        <div>
          <h2 className="font-semibold">Blood glucose</h2>
          <span className="text-xs text-slate-600">
            Eventually{' '}
            {eventually.toLocaleString(undefined, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            })}{' '}
            mmol/l
          </span>
        </div>
      </GraphTitle>
      <BloodGlucoseContent
        now={now}
        glucose={glucose}
        prediction={predictions}
        lastBloodGlucose={lastBloodGlucose.value}
      />
    </GraphContainer>
  )
}
