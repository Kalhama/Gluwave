import { deleteCarbs } from '@/actions/delete-carbs'
import { validateRequest } from '@/auth'
import { CarbDialog } from '@/components/carb-dialog'
import { ClientDateTime } from '@/components/client-datetime'
import { DeleteDialog } from '@/components/delete-dialog'
import { PageDatePicker } from '@/components/page-date-picker'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Statistics } from '@/lib/sql_utils'
import { addHours, endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { Pencil } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

interface Props {
  date: Date
}

async function ListCarbTable({ date }: Props) {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  if (!user) redirect('/login')
  const now = new Date()

  const start = date
  const end = addHours(date, 24)

  const tf = Statistics.carbs_timeframe(user.id, start, end)
  let carbs = await Statistics.execute(
    Statistics.attributed_carbs_simple(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  carbs = carbs
    .filter(
      (carb) =>
        carb.id !== -1 &&
        carb.timestamp.getTime() >= start.getTime() &&
        carb.timestamp.getTime() <= end.getTime()
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <div>
      {carbs.map((carb, i, arr) => {
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
                    <CarbDialog carb={carb}>
                      <Button variant="ghost" className="p-2">
                        <Pencil className="cursor-pointer w-4 h-4" />
                      </Button>
                    </CarbDialog>
                    <DeleteDialog id={carb.id} action={deleteCarbs} />
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
            {arr.length - 1 !== i && <Separator />}
          </div>
        )
      })}
      {carbs.length === 0 && (
        <p className="text-center p-2 text-slate-400">No entries</p>
      )}
    </div>
  )
}

export default async function InsulinListByDate({
  searchParams,
}: {
  searchParams: { date: string }
}) {
  const date = searchParams.date ? parseISO(searchParams.date) : new Date()
  if (!isValid(date)) {
    notFound()
  }

  return (
    <>
      <PageDatePicker date={date} />
      <div className="space-y-4 border bg-white max-w-5xl mx-auto rounded-md shadow p-2 mt-4">
        <ListCarbTable date={date} />
      </div>
    </>
  )
}
