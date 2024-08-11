'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { carb } from '@/schema'
import { addCarbSchema } from '@/schemas/addCarbSchema'
import { addMinutes } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const addCarbAction = wrapServerAction(
  async (data: z.infer<typeof addCarbSchema>) => {
    const parsed = addCarbSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db.insert(carb).values({
      amount: parsed.amount,
      timestamp: addMinutes(new Date(), parsed.timedelta),
      decay: parsed.decay,
      userId: user.id,
    })

    revalidatePath('/carb/list')
  }
)
