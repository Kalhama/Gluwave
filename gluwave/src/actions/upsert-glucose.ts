'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { glucose } from '@/schema'
import { addMinutes } from 'date-fns'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { upsertGlucoseSchema } from '../schemas/upsertGlucoseSchema'

export const upsertGlucosenAction = wrapServerAction(
  async (data: z.infer<typeof upsertGlucoseSchema>) => {
    const parsed = upsertGlucoseSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    if (parsed.id) {
      await db
        .update(glucose)
        .set({
          value: parsed.value,
          timestamp: parsed.timestamp,
        })
        .where(and(eq(glucose.userId, user.id), eq(glucose.id, parsed.id)))
    } else {
      await db.insert(glucose).values({
        value: parsed.value,
        timestamp: parsed.timestamp,
        userId: user.id,
      })
    }

    revalidatePath('/glucose/list')
  }
)
