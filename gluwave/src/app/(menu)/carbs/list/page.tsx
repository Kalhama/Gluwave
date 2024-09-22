import { validateRequest } from '@/auth'
import { CarbDialog } from '@/components/carb-dialog'
import { ClientDateTime } from '@/components/client-datetime'
import { PageDatePicker } from '@/components/page-date-picker'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Statistics } from '@/lib/sql_utils'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { Pencil } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import * as React from 'react'

import { DeleteCarbButton } from './delete-carbs-button'

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

  const start = startOfDay(date)
  const end = endOfDay(date)

  const tf = Statistics.carbs_timeframe(user.id, start, end)
  const carbs = await Statistics.execute(
    Statistics.observedCarbsPerMeal(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  return (
    <div>
      {carbs
        .filter((carb) => carb.timestamp >= start)
        .map((carb, i, arr) => {
          const over = carb.observedCarbs > carb.carbs
          if (carb.id !== -1) {
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
                      <CarbDialog carb={carb}>
                        <Button variant="link" className="p-2">
                          <Pencil className="cursor-pointer w-4 h-4" />
                        </Button>
                      </CarbDialog>
                      <DeleteCarbButton id={carb.id} />
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
          }
        })}
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
