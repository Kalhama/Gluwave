'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { attributed_carbs_base, carbs } from '@/schema'
import { upsertCarbSchema } from '@/schemas/upsertCarbSchema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const upsertCarbsAction = wrapServerAction(
  async (data: z.infer<typeof upsertCarbSchema>) => {
    const parsed = upsertCarbSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    if (parsed.id) {
      await db
        .update(carbs)
        .set({
          amount: parsed.carbs,
          timestamp: parsed.timestamp,
          decay: parsed.decay,
        })
        .where(and(eq(carbs.userId, user.id), eq(carbs.id, parsed.id)))
    } else {
      await db.insert(carbs).values({
        amount: parsed.carbs,
        timestamp: parsed.timestamp,
        decay: parsed.decay,
        userId: user.id,
      })
    }

    await db.refreshMaterializedView(attributed_carbs_base)

    revalidatePath('/carb/list')
  }
)
