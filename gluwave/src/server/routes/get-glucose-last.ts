import { db } from '@/db'
import { glucose } from '@/schema'
import { differenceInMinutes, subMinutes } from 'date-fns'
import { and, desc, eq, gte, lte, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetGlucoseLastSchema = z.undefined()

export const getGlucoseLast = async ({
  ctx: { user },
}: RouteProps<z.infer<typeof ZGetGlucoseLastSchema>>) => {
  const res = await db
    .select()
    .from(glucose)
    .where(and(eq(glucose.userId, user.id)))
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  const last = res.find((e) => true) // return first, gain type

  if (!last) {
    return {
      last: null,
      trend: null,
    }
  }

  const [first] = await db
    .select()
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, last.userId),
        gte(glucose.timestamp, subMinutes(last.timestamp, 45)),
        lte(glucose.timestamp, subMinutes(last.timestamp, 10)),
        ne(glucose.id, last.id)
      )
    )
    .orderBy(
      sql`ABS(EXTRACT (EPOCH FROM ${glucose.timestamp} - ${subMinutes(new Date(), 30).toISOString()})) ASC`
    )
    .limit(1)

  if (!first) {
    return {
      last: last,
      trend: null,
    }
  }

  const slope =
    (last.value - first.value) /
    differenceInMinutes(last.timestamp, first.timestamp)

  // Multiply slope by magic number to make the results look good
  const trend = ((Math.atan(slope * 12) * 180) / Math.PI) * -1

  return {
    last,
    trend,
  }
}
