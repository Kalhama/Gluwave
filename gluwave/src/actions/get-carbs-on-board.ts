'use server'

import { validateRequest } from '@/auth'
import { ServerActionError } from '@/lib/server-action-error'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const getCarbsOnBoardSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getCarbsOnBoardAction = wrapServerAction(
  async (data: z.infer<typeof getCarbsOnBoardSchema>) => {
    const { user } = await validateRequest()
    if (!user) {
      redirect('/login')
    }

    const { success, data: params } = getCarbsOnBoardSchema.safeParse(data)

    if (!success) {
      throw new ServerActionError('bad request')
    }

    const now = new Date()
    const results = await calculateUserCarbsData(
      params.start,
      params.end,
      user.id
    )

    return results
  }
)
