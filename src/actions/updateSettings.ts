'use server'

import { db } from '@/db'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { settings } from '@/schema'
import { updateSettingsSchema } from '@/schemas/updateSettingsSchema'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const updateSettings = wrapServerAction(
  async (data: z.infer<typeof updateSettingsSchema>) => {
    const parsed = updateSettingsSchema.parse(data)

    await db.update(settings).set(parsed)

    revalidatePath('/settings')
  }
)
