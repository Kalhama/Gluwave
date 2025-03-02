import { db } from '@/db'
import { apiKeyTable, userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZPostApiKeySchema = z.undefined()
export const ZPostApiKeyOutputSchema = z.object({
  apikey: z.string(),
})

export const postApiKey = async ({
  ctx: { user },
}: RouteProps<z.infer<typeof ZPostApiKeySchema>>) => {
  const apikey = nanoid()

  await db.insert(apiKeyTable).values({
    key: apikey,
    userId: user.id,
  })

  return { apikey }
}
