'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatISO, startOfDay, subDays } from 'date-fns'
import { redirect } from 'next/navigation'

interface Props {
  date: Date
}

export const BloodGlucoseListDatePicker = ({ date }: Props) => {
  const today = startOfDay(new Date())
  const selectableDays = Array.from({ length: 60 }).map((_, i) =>
    subDays(today, i)
  )

  const handleDateChange = (val: string) => {
    redirect(`/glucose/list/${val}`)
  }

  return (
    <Select
      onValueChange={handleDateChange}
      defaultValue={formatISO(date, { representation: 'date' })}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {selectableDays.map((d) => {
          const isoString = formatISO(d, { representation: 'date' })
          return (
            <SelectItem key={isoString} value={isoString}>
              {d.toLocaleDateString()}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
