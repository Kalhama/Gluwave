'use server'

import { validateRequest } from '@/auth'
import { ServerActionError } from '@/lib/server-action-error'
import { observedCarbs } from '@/lib/sql_utils'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const getObservedCarbsSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getObservedCarbsAction = wrapServerAction(
  async (data: z.infer<typeof getObservedCarbsSchema>) => {
    const { user } = await validateRequest()
    if (!user) {
      redirect('/login')
    }

    const {
      success,
      error,
      data: params,
    } = getObservedCarbsSchema.safeParse(data)

    if (!success) {
      throw new ServerActionError('bad request')
    }

    const results = await observedCarbs(params.start, params.end, user.id)

    return results
  }
)
