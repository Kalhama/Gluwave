import { db } from '@/db'
import { apiKeyTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetApiKeySchema = z.void()

export const ZGetApiKeyOutputSchema = z.array(createSelectSchema(apiKeyTable))

export const getApiKey = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZGetApiKeySchema>>) => {
  return db.select().from(apiKeyTable).where(eq(apiKeyTable.userId, user.id))
}
