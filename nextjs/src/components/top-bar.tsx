import { validateRequest } from '@/auth'
import { db } from '@/db'
import { glucose } from '@/schema'
import { differenceInHours, differenceInMinutes, subMinutes } from 'date-fns'
import { and, desc, eq, gte } from 'drizzle-orm'
import { timestamp } from 'drizzle-orm/pg-core'
import { MoveRight } from 'lucide-react'
import { redirect } from 'next/navigation'

export const TopBar = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const tailGlucose = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, user.id),
        gte(glucose.timestamp, subMinutes(new Date(), 20))
      )
    )
    .orderBy(desc(glucose.timestamp))

  const first = tailGlucose[tailGlucose.length - 1]
  const last = tailGlucose[0]

  if (!first || !last) return null

  const minutesDelta = differenceInMinutes(new Date(), last.timestamp)

  const trend = (last.value - first.value) / (minutesDelta / 60)

  const trendDegrees = (Math.atan(trend) * 180) / Math.PI

  return (
    <div className="border-b p-4 flex justify-between items-center">
      <div className="rounded-full inline p-2">
        <span className="text-2xl font-bold">{last.value}</span>
        <span> mmol/l</span>
        <MoveRight style={{ rotate: `${trendDegrees * -1}deg` }} />
      </div>
      <div>
        Last value {minutesDelta > 60 ? '>60' : minutesDelta} minutes ago
      </div>
    </div>
  )
}
