'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { glucose } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteGlucoseSchema = z.object({
  id: z.number().gte(0),
})

export const deleteGlucose = wrapServerAction(
  async (data: z.infer<typeof deleteGlucoseSchema>) => {
    const parsed = deleteGlucoseSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db
      .delete(glucose)
      .where(and(eq(glucose.id, parsed.id), eq(glucose.userId, user.id)))

    revalidatePath('/insulin/list')
  }
)
