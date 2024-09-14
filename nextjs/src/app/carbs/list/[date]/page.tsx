import { validateRequest } from '@/auth'
import { ClientDateTime } from '@/components/client-datetime'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Statistics } from '@/lib/sql_utils'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
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

  if (!user) redirect('/login')
  const now = new Date()

  const start = startOfDay(now)
  const end = endOfDay(now)

  const carbs = await Statistics.carbs_timeframe(
    user.id,
    start,
    end
  ).observed_carbs_per_meal(
    user.id,
    user.carbohydrateRatio,
    user.correctionRatio
  )

  return (
    <div className="border rounded-sm">
      {carbs
        .filter((carb) => carb.timestamp >= start)
        .map((carb) => {
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
                    <div className="flex items-center gap-4 justify-end">
                      <div>
                        <ClientDateTime timestamp={carb.timestamp} /> +{' '}
                        {(carb.decay / 60).toLocaleString([], {
                          maximumFractionDigits: 1,
                        })}
                        <span> h</span>
                      </div>
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
                <Separator />
              </div>
            )
          }
        })}
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
