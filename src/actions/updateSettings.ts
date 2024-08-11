'use server'

import { db } from '@/db'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { userTable } from '@/schema'
import { updateSettingsSchema } from '@/schemas/updateSettingsSchema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const updateSettings = wrapServerAction(
  async (data: z.infer<typeof updateSettingsSchema>) => {
    const parsed = updateSettingsSchema.parse(data)

    await db
      .update(userTable)
      .set({
        carbsPerUnits: parsed.carbsPerUnits,
        adjustmentRate: parsed.adjustmentRate,
        target: parsed.target,
        insulinOnBoardOffset: parsed.target,
      })
      .where(eq(userTable.id, parsed.id))

    revalidatePath('/settings')
  }
)
