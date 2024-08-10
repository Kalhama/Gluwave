'use server'

import { db } from '@/db'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { insulin } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteInsulinSchema = z.object({
  id: z.number().gte(0),
})

export const deleteInsulin = wrapServerAction(
  async (data: z.infer<typeof deleteInsulinSchema>) => {
    const parsed = deleteInsulinSchema.parse(data)

    await db.delete(insulin).where(eq(insulin.id, parsed.id))

    revalidatePath('/insulin/list')
  }
)
