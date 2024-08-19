'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { glucose } from '@/schema'
import { addMinutes } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { addGlucoseSchema } from '../schemas/addGlucoseSchema'

export const addGlucosenAction = wrapServerAction(
  async (data: z.infer<typeof addGlucoseSchema>) => {
    const parsed = addGlucoseSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db.insert(glucose).values({
      value: parsed.value,
      timestamp: addMinutes(new Date(), parsed.timedelta),
      userId: user.id,
    })

    revalidatePath('/glucose/list')
  }
)
