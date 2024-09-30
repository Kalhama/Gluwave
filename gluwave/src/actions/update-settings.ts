'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { userTable } from '@/schema'
import { updateSettingsSchema } from '@/schemas/updateSettingsSchema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export const updateSettings = wrapServerAction(
  async (data: z.infer<typeof updateSettingsSchema>) => {
    const parsed = updateSettingsSchema.parse(data)

    const { user } = await validateRequest()
    if (!user) {
      throw new ServerActionError('User not found')
    }

    await db
      .update(userTable)
      .set({
        carbohydrateRatio: parsed.carbohydrateRatio,
        correctionRatio: parsed.correctionRatio,
        target: parsed.target,
        insulinOnBoardOffset: parsed.insulinOnBoardOffset,
      })
      .where(eq(userTable.id, user.id))

    redirect('/')
  }
)
