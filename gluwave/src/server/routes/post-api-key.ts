import { db } from '@/db'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZPostApiKeySchema = z.undefined()
export const ZPostApiKeyOutputSchema = z.string()

export const postApiKey = async ({
  ctx: { user },
}: RouteProps<z.infer<typeof ZPostApiKeySchema>>) => {
  const key = nanoid()

  await db
    .update(userTable)
    .set({
      apikey: key,
    })
    .where(eq(userTable.id, user.id))

  return key
}
