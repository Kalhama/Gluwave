import { db } from '@/db'
import { glucose } from '@/schema'
import { glucose_prediction } from '@/server/services/glucose'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetGlucosePredictionSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getGlucosePrediction = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetGlucosePredictionSchema>>) => {
  const glu = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, user.id),
        gte(glucose.timestamp, start),
        lte(glucose.timestamp, end)
      )
    )
    .orderBy(glucose.timestamp)

  const startPrediction = glu[glu.length - 1]?.timestamp || start

  const r = await glucose_prediction(user.id, startPrediction, end)
  return r.toRecords()
}
