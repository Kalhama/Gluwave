import { validateRequest } from '@/auth'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { db } from '@/db'
import { cn } from '@/lib/utils'
import { glucose } from '@/schema'
import { differenceInMinutes, formatDistance, subMinutes } from 'date-fns'
import { and, desc, eq, gte, lte, ne } from 'drizzle-orm'
import { MoveRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { MenuBar } from './menu-bar'

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
    if (stale) return 'bg-slate-300 shadow-slate-300'
    else if (last.value < 3.8) return 'bg-red-600 shadow-red-600'
    else if (last.value > 11) return 'bg-orange-500 shadow-orange-500'
    else return 'bg-green-600 shadow-green-600'
  })()

  return (
    <MenuBar>
      <div className="h-6 w-6" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              className="flex justify-center items-center gap-2 mx-auto cursor-pointer"
            >
              <div
                className={cn(
                  'h-4 w-4 shadow-[0_0_6px] rounded-full mr-1',
                  status
                )}
              />
              <div className="text-2xl font-bold">
                {veryStale
                  ? '-.-'
                  : last.value.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                <span className="text-sm font-normal text-slate-700">
                  {' '}
                  mmol/l
                </span>
              </div>

              {trend !== null && (
                <MoveRight
                  className="h-4 w-4"
                  style={{ rotate: `${trend}deg` }}
                />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Latest reading{' '}
              {formatDistance(last.timestamp, new Date(), {
                includeSeconds: false,
              })}{' '}
              ago
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </MenuBar>
  )
}
