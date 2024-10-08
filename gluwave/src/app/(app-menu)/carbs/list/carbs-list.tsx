'use client'

import { CarbohydrateDialog } from '@/components/carbohydrate-dialog'
import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialogMutation } from '@/components/delete-dialog-mutation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/trcp/client'
import { Pencil } from 'lucide-react'
import * as React from 'react'

const CarbDeleteDialog = ({ id }: { id: number }) => {
  const del = trpc.carbohydrate.delete.useMutation()
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
              utils.carbohydrate.invalidate()
            },
          }
        )
      }}
    />
  )
}

export const CarbsList = ({ start, end }: { start: Date; end: Date }) => {
  const c = trpc.analysis.getCarbohydrateAttributed.useQuery({ start, end })

  if (c.isPending) {
    return 'Loading'
  }

  if (c.isLoadingError) {
    return 'Error'
  }

  return (
    <div className=" border bg-white max-w-5xl mx-auto rounded-md shadow p-2 mt-4">
      {c.data.map((carb, i, arr) => {
        const over = carb.observedCarbs > carb.carbs

        return (
          <div key={carb.id}>
            <div className="p-2">
              <div className="grid grid-cols-2 pb-2">
                <div>
                  <div>{Math.round(carb.carbs)} g </div>
                  <div>Observed: {Math.round(carb.observedCarbs)} g </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div>
                    <ClientDateTime timestamp={carb.timestamp} /> +{' '}
                    {(carb.decay / 60).toLocaleString([], {
                      maximumFractionDigits: 1,
                    })}
                    <span> h</span>
                  </div>
                  <div>
                    <CarbohydrateDialog carb={carb}>
                      <Button variant="ghost" className="p-2">
                        <Pencil className="cursor-pointer w-4 h-4" />
                      </Button>
                    </CarbohydrateDialog>
                    <CarbDeleteDialog id={carb.id} />
                  </div>
                </div>
              </div>
              {over ? (
                <Progress
                  className="h-2 bg-orange-400"
                  value={(carb.carbs / carb.observedCarbs) * 100}
                />
              ) : (
                <Progress
                  className="h-2 "
                  value={(carb.observedCarbs / carb.carbs) * 100}
                />
              )}
            </div>
            {arr.length - 1 !== i && <Separator className="my-2" />}
          </div>
        )
      })}
      {c.data.length === 0 && (
        <p className="text-center p-2 text-slate-400">No meal entries</p>
      )}
    </div>
  )
}
