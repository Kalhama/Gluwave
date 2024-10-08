import { db } from '@/db'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeleteApiKeySchema = z.undefined()

export const deleteApiKey = async ({
  ctx: { user },
}: RouteProps<z.infer<typeof ZDeleteApiKeySchema>>) => {
  await db
    .update(userTable)
    .set({
      apikey: null,
    })
    .where(eq(userTable.id, user.id))

  return null
}
