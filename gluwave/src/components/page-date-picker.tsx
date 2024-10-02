'use client'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { addDays, formatISO, startOfDay } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { redirect, usePathname } from 'next/navigation'
import * as React from 'react'
import { useEffect, useState } from 'react'

import { Button } from './ui/button'
import { useClient } from './use-client'

interface Props {
  date: Date
}

export function PageDatePicker({ date: defaultValue }: Props) {
  const route = usePathname()

  const [date, setDate] = useState<Date>(defaultValue)

  useEffect(() => {
    const handleRedirect = (date: Date) =>
      redirect(
        `${route}?date=${encodeURIComponent(formatISO(startOfDay(date)))}`
      )
    const isDateChanged = (d1: Date, d2: Date) => d1.getTime() !== d2.getTime()
    const isClientTimezone = (d: Date) =>
      d.getTimezoneOffset() !== new Date().getTimezoneOffset()
    const isStartofDay = (d: Date) => startOfDay(d).getTime() !== d.getTime()

    if (isDateChanged(date, defaultValue)) {
      handleRedirect(date)
    } else if (isClientTimezone(date)) {
      handleRedirect(new Date())
    } else if (isStartofDay(date)) {
      handleRedirect(date)
    }
  }, [defaultValue, date, route])

  const client = useClient()

  return (
    <div className="bg-slate-300 p-2">
      <div className="flex justify-between items-center mx-auto max-w-md">
        <Button variant="ghost" className="hover:bg-slate-400">
          <ChevronLeft
            onClick={() => setDate(addDays(date, -1))}
            className="cursor-pointer"
          />
        </Button>
        {!client ? null : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="hover:bg-slate-400">
                <div className="flex items-center text-slate-700 cursor-pointer">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? date.toLocaleDateString() : <span>Pick a date</span>}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => setDate(d || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
        <Button variant="ghost" className="hover:bg-slate-400">
          <ChevronRight
            onClick={() => setDate(addDays(date, 1))}
            className="cursor-pointer"
          />
        </Button>
      </div>
    </div>
  )
}
