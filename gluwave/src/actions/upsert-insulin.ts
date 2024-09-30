'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { insulin } from '@/schema'
import { upsertInsulinSchema } from '@/schemas/upsertInsulinSchema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const upsertInsulinAction = wrapServerAction(
  async (data: z.infer<typeof upsertInsulinSchema>) => {
    const parsed = upsertInsulinSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    if (parsed.id) {
      await db
        .update(insulin)
        .set({
          amount: parsed.amount,
          timestamp: parsed.timestamp,
        })
        .where(and(eq(insulin.userId, user.id), eq(insulin.id, parsed.id)))
    } else {
      await db.insert(insulin).values({
        amount: parsed.amount,
        timestamp: parsed.timestamp,
        userId: user.id,
      })
    }

    revalidatePath('/insulin/list')
  }
)
