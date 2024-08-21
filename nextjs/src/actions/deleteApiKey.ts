'use server'

import { validateRequest } from '@/auth'
import { db } from '@/db'
import { ServerActionError } from '@/lib/server-action-error'
import { wrapServerAction } from '@/lib/wrap-server-action'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'

export const deleteApiKey = wrapServerAction(async () => {
  const { user } = await validateRequest()
  if (!user) {
    throw new ServerActionError('User not found')
  }

  await db
    .update(userTable)
    .set({
      apikey: null,
    })
    .where(eq(userTable.id, user.id))

  return 'ok'
})
