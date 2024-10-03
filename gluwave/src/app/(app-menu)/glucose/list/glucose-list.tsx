import { deleteGlucose } from '@/actions/delete-glucose'
import { validateRequest } from '@/auth'
import { BloodGlucoseDialog } from '@/components/bloodglucose-dialog'
import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialog } from '@/components/delete-dialog'
import { PageDatePicker } from '@/components/page-date-picker'
import { Button } from '@/components/ui/button'
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

export const GlucoseList = async ({ params }: Props) => {
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
    .from(glucose)
    .where(
      and(
        gte(glucose.timestamp, start),
        lt(glucose.timestamp, end),
        eq(glucose.userId, user.id)
      )
    )
    .orderBy(asc(glucose.timestamp))

  return (
    <>
      <PageDatePicker baseUrl="/glucose/list" date={date} />
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
              {results.map((glucose) => (
                <TableRow key={glucose.id}>
                  <TableCell className="font-medium">
                    <ClientDateTime timestamp={glucose.timestamp} />
                  </TableCell>
                  <TableCell>{glucose.value} mmol/l</TableCell>
                  <TableCell className="text-right flex justify-end">
                    <BloodGlucoseDialog
                      glucose={{
                        ...glucose,
                        glucose: glucose.value,
                      }}
                    >
                      <Button variant="ghost" className="p-2">
                        <Pencil className="cursor-pointer w-4 h-4" />
                      </Button>
                    </BloodGlucoseDialog>
                    <DeleteDialog action={deleteGlucose} id={glucose.id} />
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
          </Table>
        </div>
      </div>
    </>
  )
}
