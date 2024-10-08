'use client'

import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialogMutation } from '@/components/delete-dialog-mutation'
import { InsulinDialog } from '@/components/insulin-dialog'
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
import { trpc } from '@/lib/trcp/client'
import { Pencil } from 'lucide-react'
import * as React from 'react'

const InsulinDeleteDialog = ({ id }: { id: number }) => {
  const del = trpc.insulin.delete.useMutation()
  const utils = trpc.useUtils()
  return (
    <DeleteDialogMutation
      loading={del.isPending}
      onDelete={() => {
        del.mutate(
          { id },
          {
            onSuccess() {
              utils.analysis.invalidate()
              utils.insulin.invalidate()
            },
          }
        )
      }}
    />
  )
}

interface Props {
  start: Date
  end: Date
}

export function InsulinList({ start, end }: Props) {
  const i = trpc.insulin.get.useQuery({ start, end })

  if (i.isPending) {
    return 'loading'
  }

  if (i.isError) {
    return 'Error'
  }

  return (
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
            {i.data.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">
                  <ClientDateTime timestamp={i.timestamp} />
                </TableCell>
                <TableCell>{i.amount} U</TableCell>
                <TableCell className="text-right flex justify-end">
                  <InsulinDialog insulin={i}>
                    <Button variant="ghost" className="p-2">
                      <Pencil className="cursor-pointer w-4 h-4" />
                    </Button>
                  </InsulinDialog>
                  <InsulinDeleteDialog id={i.id} />
                </TableCell>
              </TableRow>
            ))}
            {i.data.length === 0 && (
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
                {i.data.reduce(
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
  )
}
