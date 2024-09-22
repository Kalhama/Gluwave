import { validateRequest } from '@/auth'
import { BloodGlucoseDialog } from '@/components/bloodglucose-dialog'
import { ClientDateTime } from '@/components/client-datetime'
import { PageDatePicker } from '@/components/page-date-picker'
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
import { Pencil } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

import { DeleteBloodGlucoseButton } from './delete-blood-glucose-button'

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
    <div>
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
                <ClientDateTime timestamp={glucose.timestamp} />
              </TableCell>
              <TableCell>{glucose.value} mmol/l</TableCell>
              <TableCell className="text-right flex gap-2 justify-end">
                <BloodGlucoseDialog
                  glucose={{
                    ...glucose,
                    glucose: glucose.value,
                  }}
                >
                  <Pencil className="cursor-pointer w-4 h-4" />
                </BloodGlucoseDialog>
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
  searchParams,
}: {
  searchParams: { date: string }
}) {
  const date = searchParams.date ? parseISO(searchParams.date) : new Date()
  if (!isValid(date)) {
    notFound()
  }

  return (
    <div className="space-y-4 border bg-white max-w-5xl mx-auto rounded-md shadow p-2 mt-4">
      <PageDatePicker date={date} />
      <ListBloodGlucoseTable date={date} />
    </div>
  )
}
