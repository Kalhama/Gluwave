import { deleteInsulin } from '@/actions/delete-insulin'
import { validateRequest } from '@/auth'
import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialog } from '@/components/delete-dialog'
import { InsulinDialog } from '@/components/insulin-dialog'
import { PageDatePicker } from '@/components/page-date-picker'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/db'
import { insulin } from '@/schema'
import { addHours, parseISO, subHours } from 'date-fns'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { Pencil } from 'lucide-react'
import { redirect } from 'next/navigation'
import * as React from 'react'

interface Props {
  params: {
    date?: string
  }
}

export async function InsulinList({ params }: Props) {
  const date = params?.date ? new Date(Number(params.date)) : undefined

  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(date ?? now, date ? 0 : 24)
  const end = addHours(date ?? now, 24)

  const results = await db
    .select()
    .from(insulin)
    .where(
      and(
        gte(insulin.timestamp, start),
        lt(insulin.timestamp, end),
        eq(insulin.userId, user.id)
      )
    )
    .orderBy(asc(insulin.timestamp))

  return (
    <>
      <PageDatePicker baseUrl="/insulin/list" date={date} />
      <div className="space-y-4 border bg-white max-w-5xl mx-auto rounded-md shadow p-2 mt-4">
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
              {results.map((insulin) => (
                <TableRow key={insulin.id}>
                  <TableCell className="font-medium">
                    <ClientDateTime timestamp={insulin.timestamp} />
                  </TableCell>
                  <TableCell>{insulin.amount} U</TableCell>
                  <TableCell className="text-right flex justify-end">
                    <InsulinDialog insulin={insulin}>
                      <Button variant="ghost" className="p-2">
                        <Pencil className="cursor-pointer w-4 h-4" />
                      </Button>
                    </InsulinDialog>
                    <DeleteDialog action={deleteInsulin} id={insulin.id} />
                  </TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-slate-400">
                    No entries
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell>
                  {results.reduce(
                    (accumulator, currentValue) =>
                      accumulator + currentValue.amount,
                    0
                  )}{' '}
                  U
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </>
  )
}
