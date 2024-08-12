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
import { insulin } from '@/schema'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

import { AddInsulinDialog } from './AddInsulinDialog'
import { DeleteInsulinButton } from './DeleteInsulinButton'
import { InsulinListDatePicker } from './InsulinListDatePicker'

interface Props {
  date: Date
}

async function ListInsulinTable({ date }: Props) {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const results = await db
    .select()
    .from(insulin)
    .where(
      and(
        gte(insulin.timestamp, startOfDay(date)),
        lt(insulin.timestamp, endOfDay(date)),
        eq(insulin.userId, user.id)
      )
    )
    .orderBy(asc(insulin.timestamp))

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
          {results.map((insulin) => (
            <TableRow key={insulin.id}>
              <TableCell className="font-medium">
                {insulin.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell>{insulin.amount} U</TableCell>
              <TableCell className="text-right">
                <DeleteInsulinButton id={insulin.id} />
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

  return (
    <div className="space-y-4">
      <InsulinListDatePicker date={date} />
      <ListInsulinTable date={date} />
      <AddInsulinDialog />
    </div>
  )
}
