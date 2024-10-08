import { db } from '@/db'
import { insulin } from '@/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetInsulinSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getInsulin = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetInsulinSchema>>) => {
  return await db
    .select()
    .from(insulin)
    .where(
      and(
        eq(insulin.userId, user.id),
        gte(insulin.timestamp, start),
        lte(insulin.timestamp, end)
      )
    )
    .orderBy(insulin.timestamp)
}
