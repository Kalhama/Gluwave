'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { trpc } from '@/lib/trcp/client'
import { cn } from '@/lib/utils'
import { differenceInMinutes, formatDistance } from 'date-fns'
import { MoveRight } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect } from 'react'

import { Skeleton } from './ui/skeleton'

export const GlucoseStatus = () => {
  const d = trpc.glucose.getLast.useQuery(undefined, {
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (d?.data?.last) {
      if (differenceInMinutes(new Date(), d.data.last.timestamp) < 60) {
        document.title = `${d.data.last.value.toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} mmol/l`
      } else {
        document.title = 'Gluwave'
      }
    }
  }, [d?.data?.last])

  if (d.isPending) {
    return (
      <Link className="mx-auto" href="/">
        <Skeleton className="w-32 h-6 " />
      </Link>
    )
  }

  if (d.isLoadingError) {
    return 'Error'
  }

  const trend = d.data.trend

  const last = d.data.last
  const minutesDelta = last
    ? differenceInMinutes(new Date(), new Date(last.timestamp))
    : 99999
  const stale = minutesDelta > 30 || !last
  const veryStale = minutesDelta > 60 || !last
  const status = (() => {
    if (stale) return 'bg-slate-300 shadow-slate-300'
    else if (last.value < 3.8) return 'bg-red-600 shadow-red-600'
    else if (last.value > 11) return 'bg-orange-500 shadow-orange-500'
    else return 'bg-green-600 shadow-green-600'
  })()

  return (
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
            {last
              ? formatDistance(last.timestamp, new Date(), {
                  includeSeconds: false,
                })
              : 'NA mins'}{' '}
            ago
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
