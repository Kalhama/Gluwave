import CarbohydrateAbsorptionRate from '@/components/carbohydrate-absorption-rate'
import { PageDatePicker } from '@/components/page-date-picker'
import { createSSRHelper } from '@/server'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { addHours, startOfHour, subHours } from 'date-fns'
import * as React from 'react'

import { CarbsList } from './carbs-list'

interface Props {
  params: {
    date?: string
  }
}
export async function CarbsPage({ params }: Props) {
  const date = params?.date ? new Date(Number(params.date)) : undefined

  const now = new Date()
  const start = subHours(date ?? startOfHour(now), date ? 0 : 24)
  const end = addHours(date ?? startOfHour(now), 24)

  const helpers = await createSSRHelper()
  await helpers.analysis.getCarbohydrateAttributed.prefetch({ start, end })

  return (
    <>
      <PageDatePicker date={date} baseUrl="/carbs/list" />
      <div className="max-w-5xl mx-auto p-2">
        <div className="md:grid grid-cols-2 gap-2">
          <CarbohydrateAbsorptionRate start={start} end={end} />
        </div>

        <HydrationBoundary state={dehydrate(helpers.queryClient)}>
          <CarbsList start={start} end={end} />
        </HydrationBoundary>
      </div>
    </>
  )
}
