'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const newApiKey = wrapServerAction(async () => {
  const { user } = await validateRequest()
  if (!user) {
    throw new ServerActionError('User not found')
  }

  const key = nanoid()

  await db
    .update(userTable)
    .set({
      apikey: key,
    })
    .where(eq(userTable.id, user.id))

  return key
})
