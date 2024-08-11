'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { insulin } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteInsulinSchema = z.object({
  id: z.number().gte(0),
})

export const deleteInsulin = wrapServerAction(
  async (data: z.infer<typeof deleteInsulinSchema>) => {
    const parsed = deleteInsulinSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db
      .delete(insulin)
      .where(and(eq(insulin.id, parsed.id), eq(insulin.userId, user.id)))

    revalidatePath('/insulin/list')
  }
)
