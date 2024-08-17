import { validateRequest } from '@/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/db'
import { glucose } from '@/schema'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

import { BloodGlucoseListDatePicker } from './BloodGlucoseListDatePicker'
import { DeleteBloodGlucoseButton } from './DeleteBloodGlucoseButton'

interface Props {
  date: Date
}

async function ListBloodGlucoseTable({ date }: Props) {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const results = await db
    .select()
    .from(glucose)
    .where(
      and(
        gte(glucose.timestamp, startOfDay(date)),
        lt(glucose.timestamp, endOfDay(date)),
        eq(glucose.userId, user.id)
      )
    )
    .orderBy(asc(glucose.timestamp))

  return (
    <div className="border rounded-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((glucose) => (
            <TableRow key={glucose.id}>
              <TableCell className="font-medium">
                {glucose.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell>{glucose.value} mmol/l</TableCell>
              <TableCell className="text-right">
                <DeleteBloodGlucoseButton id={glucose.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function BloodGlucoseListByDate({
  params,
}: {
  params: { date: string }
}) {
  const date = parseISO(params.date)
  if (!isValid(date)) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <BloodGlucoseListDatePicker date={date} />
      <ListBloodGlucoseTable date={date} />
    </div>
  )
}
