import { PageDatePicker } from '@/components/page-date-picker'
import { createSSRHelper } from '@/server'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { addHours, subHours } from 'date-fns'
import * as React from 'react'

import { GlucoseList } from './glucose-list'

interface Props {
  params: {
    date?: string
  }
}

export const GlucosePage = async ({ params }: Props) => {
  const date = params?.date ? new Date(Number(params.date)) : undefined

  const now = new Date()
  const start = subHours(date ?? now, date ? 0 : 24)
  const end = addHours(date ?? now, 24)

  const helpers = await createSSRHelper()
  await helpers.glucose.get.prefetch({ start, end })

  return (
    <>
      <PageDatePicker baseUrl="/glucose/list" date={date} />
      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <GlucoseList start={start} end={end} />
      </HydrationBoundary>
    </>
  )
}
