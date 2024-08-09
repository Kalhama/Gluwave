'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateTime, Duration, Interval } from 'luxon'
import * as React from 'react'
import { useEffect } from 'react'

interface Props {
  date: Date
  setDate: (d: Date) => unknown
  duration: Duration
  filterTime: (date: Date) => boolean
  filterDate: (date: Date) => boolean
  disabled?: boolean
}

export const roundDate = (date: DateTime, duration: Duration) => {
  return DateTime.fromMillis(
    duration.as('milliseconds') *
      Math.round(date.valueOf() / duration.as('milliseconds'))
  )
}

export function DateTimePicker({
  date,
  setDate,
  duration,
  filterTime,
  filterDate,
  disabled = false,
}: Props) {
  const dt = DateTime.fromJSDate(date)
  const times = Interval.fromDateTimes(dt.startOf('day'), dt.endOf('day'))
    .splitBy(duration)
    .map((i) => i.start || DateTime.now())
    .filter((d) => filterTime(d.toJSDate()))

  return (
    <div className="grid grid-cols-2 gap-2">
      <Popover>
        <PopoverTrigger disabled={disabled} asChild>
          <Button
            variant={'outline'}
            className={cn(
              'justify-start text-left font-normal  border-solid',
              !dt && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dt ? dt.toISODate() : <span>Valitse päivä</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            weekStartsOn={1}
            mode="single"
            selected={dt.toJSDate()}
            onSelect={(d) => {
              if (d) {
                setDate(
                  DateTime.fromJSDate(d)
                    .set({
                      hour: dt.hour,
                      minute: dt.minute,
                    })
                    .toJSDate()
                )
              }
            }}
            disabled={(d) => !filterDate(d)}
          />
        </PopoverContent>
      </Popover>
      <Select
        onValueChange={(e) => {
          if (e) {
            setDate(DateTime.fromISO(e).toJSDate())
          }
        }}
        value={times.find((t) => t.valueOf() === dt.valueOf())?.toISO() || ''}
      >
        <SelectTrigger disabled={disabled} className="border-solid">
          <SelectValue placeholder="Valitse kellonaika" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {times.map((d) => {
              return (
                <SelectItem value={d.toISO() || ''} key={d.toISOTime()}>
                  {d.toLocaleString(DateTime.TIME_24_SIMPLE)} -{' '}
                  {d.plus(duration).toLocaleString(DateTime.TIME_24_SIMPLE)}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
