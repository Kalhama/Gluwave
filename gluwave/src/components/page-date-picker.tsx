'use client'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { addDays, formatISO, parseISO, startOfDay, subDays } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { redirect, usePathname } from 'next/navigation'
import * as React from 'react'
import { useEffect, useState } from 'react'

interface Props {
  date: Date
}

export function PageDatePicker({ date: defaultValue }: Props) {
  const route = usePathname()

  const [date, setDate] = useState<Date>(defaultValue)

  useEffect(() => {
    if (date !== defaultValue) {
      redirect(`${route}?date=${formatISO(date, { representation: 'date' })}`)
    }
  }, [defaultValue, date, route])

  return (
    <div className="bg-slate-300 p-2">
      <div className="flex justify-between items-center mx-auto max-w-md">
        <ChevronLeft
          onClick={() => setDate(addDays(date, -1))}
          className="cursor-pointer"
        />
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center text-slate-700 cursor-pointer">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? date.toLocaleDateString() : <span>Pick a date</span>}
            </div>
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
        <ChevronRight
          onClick={() => setDate(addDays(date, 1))}
          className="cursor-pointer"
        />
      </div>
    </div>
  )
}
