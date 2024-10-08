import { db } from '@/db'
import { glucose } from '@/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetGlucoseSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getGlucose = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetGlucoseSchema>>) => {
  return await db
    .select()
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, user.id),
        gte(glucose.timestamp, start),
        lte(glucose.timestamp, end)
      )
    )
    .orderBy(glucose.timestamp)
}
