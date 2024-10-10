'use client'

import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialogMutation } from '@/components/delete-dialog-mutation'
import { GlucoseDialog } from '@/components/glucose-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trcp/client'
import { Pencil } from 'lucide-react'
import * as React from 'react'

const GlucoseDeleteDialog = ({ id }: { id: number }) => {
  const del = trpc.glucose.delete.useMutation()
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
              utils.glucose.invalidate()
            },
          }
        )
      }}
    />
  )
}

interface Props {
  end: Date
  start: Date
}

export const GlucoseList = ({ start, end }: Props) => {
  const g = trpc.glucose.get.useQuery({ start, end })

  if (g.isPending) {
    return 'loading'
  }

  if (g.isError) {
    return 'Error'
  }

  return (
    <div className="p-2">
      <div className="space-y-4 border bg-white max-w-5xl mx-auto rounded-md shadow p-2 mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {g.data.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">
                  <ClientDateTime timestamp={g.timestamp} />
                </TableCell>
                <TableCell>{g.value} mmol/l</TableCell>
                <TableCell className="text-right flex justify-end">
                  <GlucoseDialog
                    glucose={{
                      ...g,
                      glucose: g.value,
                    }}
                  >
                    <Button variant="ghost" className="p-2">
                      <Pencil className="cursor-pointer w-4 h-4" />
                    </Button>
                  </GlucoseDialog>
                  <GlucoseDeleteDialog id={g.id} />
                </TableCell>
              </TableRow>
            ))}
            {g.data.length === 0 && (
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
  )
}
