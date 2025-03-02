import { db } from '@/db'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeleteApiKeySchema = z
  .object({
    id: z.string(),
  })
  .optional()

export const ZDeleteApiKeyOutputSchema = z.null()

export const deleteApiKey = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZDeleteApiKeySchema>>) => {
  // Note: The id parameter is not used since each user only has one API key
  await db
    .update(userTable)
    .set({
      apikey: null,
    })
    .where(eq(userTable.id, user.id))

  return null
}
