import { validateRequest } from '@/auth'
import { db } from '@/db'
import { glucose } from '@/schema'
import { differenceInMinutes, subMinutes } from 'date-fns'
import { and, desc, eq, gte, lte, ne } from 'drizzle-orm'
import { MoveRight } from 'lucide-react'
import { redirect } from 'next/navigation'

import { BurgerMenu } from './burger-menu'

const glucoseTrend = async (last: {
  value: number
  id: number
  timestamp: Date
  userId: string
  device: string | null
}) => {
  if (!last) return null

  const [first] = await db
    .select()
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, last.userId),
        gte(glucose.timestamp, subMinutes(last.timestamp, 45)),
        lte(glucose.timestamp, subMinutes(last.timestamp, 10)),
        ne(glucose.id, last.id)
      )
    )
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  if (!first) return null

  const slope =
    (last.value - first.value) /
    differenceInMinutes(last.timestamp, first.timestamp)

  // Multiply slope by magic number to make the results look good
  const trend = ((Math.atan(slope * 12) * 180) / Math.PI) * -1

  return trend
}

export const GlucoseBar = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const [last] = await db
    .select()
    .from(glucose)
    .where(and(eq(glucose.userId, user.id)))
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  if (!last) return null

  const trend = await glucoseTrend(last)

  const minutesDelta = differenceInMinutes(new Date(), last.timestamp)
  const stale = minutesDelta > 30
  const veryStale = minutesDelta > 60
  const status = (() => {
    if (stale) return 'border-slate-300'
    else if (last.value < 3.8) return 'border-red-600'
    else if (last.value > 11) return 'border-orange-500'
    else return 'border-green-600'
  })()

  return (
    <div className="border-b px-4 py-2 flex justify-between items-center bg-slate-50">
      <div
        className={`flex items-center border-4 px-4 py-1 rounded-full bg-white ${status}`}
      >
        <div className="rounded-full inline ">
          <span className="text-2xl font-bold">
            {veryStale
              ? '-.-'
              : last.value.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
          </span>
          <span className="text-sm"> mmol/l</span>
        </div>
        {trend !== null && (
          <MoveRight className="ml-2" style={{ rotate: `${trend}deg` }} />
        )}
      </div>
      <BurgerMenu />
    </div>
  )
}
