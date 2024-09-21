import { validateRequest } from '@/auth'
import { db } from '@/db'
import { cn } from '@/lib/utils'
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
  const veryStale = false // minutesDelta > 60
  const status = (() => {
    if (stale) return 'bg-slate-300 shadow-slate-300'
    else if (last.value < 3.8) return 'bg-red-600 shadow-red-600'
    else if (last.value > 11) return 'bg-orange-500 shadow-orange-500'
    else return 'bg-green-600 bg-green-600'
  })()

  return (
    <div className="border-b shadow rounded-b-xl bg-white p-2 flex justify-between items-center">
      <div className="flex justify-center items-center gap-2 mx-auto">
        <div
          className={cn('h-4 w-4 shadow-[0_0_6px] rounded-full mr-1', status)}
        />
        <div className="text-2xl font-bold">
          {veryStale
            ? '-.-'
            : last.value.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
          <span className="text-sm font-normal text-slate-700"> mmol/l</span>
        </div>

        {trend !== null && (
          <MoveRight className="h-4 w-4" style={{ rotate: `${trend}deg` }} />
        )}
      </div>
      <BurgerMenu className="static" />
    </div>
  )
}
