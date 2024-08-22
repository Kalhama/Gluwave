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
import { carbs } from '@/schema'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

import { CarbListDatePicker } from './carbs-list-datepicker'
import { DeleteCarbButton } from './delete-carbs-button'

interface Props {
  date: Date
}

async function ListCarbTable({ date }: Props) {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }
  const results = await db
    .select()
    .from(carbs)
    .where(
      and(
        gte(carbs.timestamp, startOfDay(date)),
        lt(carbs.timestamp, endOfDay(date)),
        eq(carbs.userId, user.id)
      )
    )
    .orderBy(asc(carbs.timestamp))

  return (
    <div className="border rounded-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Decay</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((carb) => (
            <TableRow key={carb.id}>
              <TableCell className="font-medium">
                {carb.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell>{carb.amount} g</TableCell>
              <TableCell>{carb.decay / 60} h</TableCell>
              <TableCell className="text-right">
                <DeleteCarbButton id={carb.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function InsulinListByDate({
  params,
}: {
  params: { date: string }
}) {
  const date = parseISO(params.date)
  if (!isValid(date)) {
    notFound()
  }
  const today = startOfDay(new Date())

  return (
    <div className="space-y-4">
      <CarbListDatePicker date={date} />
      <ListCarbTable date={date} />
    </div>
  )
}
