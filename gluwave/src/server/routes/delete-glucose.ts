import { db } from '@/db'
import { glucose } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeleteGlucoseSchema = z.object({
  id: z.number(),
})

export const deleteGlucose = async ({
  ctx: { user },
  input: { id },
}: RouteProps<z.infer<typeof ZDeleteGlucoseSchema>>) => {
  await db
    .delete(glucose)
    .where(and(eq(glucose.userId, user.id), eq(glucose.id, id)))

  return id
}
