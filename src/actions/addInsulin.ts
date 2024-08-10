'use server'

import { db } from '@/db'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { insulin } from '@/schema'
import { addInsulinSchema } from '@/schemas/addInsulinSchema'
import { addMinutes } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const addInsulinAction = wrapServerAction(
  async (data: z.infer<typeof addInsulinSchema>) => {
    const parsed = addInsulinSchema.parse(data)

    await db.insert(insulin).values({
      amount: parsed.amount,
      timestamp: addMinutes(new Date(), parsed.timedelta),
    })

    revalidatePath('/insulin/list')
  }
)
