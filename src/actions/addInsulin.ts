'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { insulin } from '@/schema'
import { addInsulinSchema } from '@/schemas/addInsulinSchema'
import { addMinutes } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const addInsulinAction = wrapServerAction(
  async (data: z.infer<typeof addInsulinSchema>) => {
    const parsed = addInsulinSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db.insert(insulin).values({
      amount: parsed.amount,
      timestamp: addMinutes(new Date(), parsed.timedelta),
      userId: user.id,
    })

    revalidatePath('/insulin/list')
  }
)
