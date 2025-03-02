import { db } from '@/db'
import { apiKeyTable } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeleteApiKeySchema = z.object({
  key: z.string(),
})

export const ZDeleteApiKeyOutputSchema = z.object({
  key: z.string(),
})

export const deleteApiKey = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZDeleteApiKeySchema>>) => {
  await db
    .delete(apiKeyTable)
    .where(and(eq(apiKeyTable.key, input.key), eq(apiKeyTable.userId, user.id)))

  return {
    key: input.key,
  }
}
