import { validateRequest } from '@/auth'
import { PageDatePicker } from '@/components/page-date-picker'
import { createSSRHelper } from '@/server'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'
import * as React from 'react'

import { InsulinList } from './insulin-list'

interface Props {
  params: {
    date?: string
  }
}

export async function InsulinPage({ params }: Props) {
  const date = params?.date ? new Date(Number(params.date)) : undefined

  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(date ?? now, date ? 0 : 24)
  const end = addHours(date ?? now, 24)

  const helpers = await createSSRHelper()
  await helpers.insulin.get.prefetch({ start, end })

  return (
    <>
      <PageDatePicker baseUrl="/insulin/list" date={date} />

      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <InsulinList start={start} end={end} />
      </HydrationBoundary>
    </>
  )
}
