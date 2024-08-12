'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { carbs } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteCarbSchema = z.object({
  id: z.number().gte(0),
})

export const deleteCarb = wrapServerAction(
  async (data: z.infer<typeof deleteCarbSchema>) => {
    const parsed = deleteCarbSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db
      .delete(carbs)
      .where(and(eq(carbs.id, parsed.id), eq(carbs.userId, user.id)))

    revalidatePath('/carb/list')
  }
)
