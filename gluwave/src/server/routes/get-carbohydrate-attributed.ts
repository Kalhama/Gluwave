import { z } from 'zod'

import { Statistics } from '../services/sql_utils'
import { RouteProps } from './RouteProps'
import { db } from '@/db'

export const ZGetCarbohydrateAttributedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const ZGetCarbohydrateAttributedOutputSchema = z.array(
  z.object({
    id: z.number(),
    timestamp: z.date(),
    carbs: z.number(),
    decay: z.number(),
    observedCarbs: z.number(),
  })
)

export const getCarbohydrateAttributed = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydrateAttributedSchema>>) => {
  const tf = Statistics.carbs_timeframe(user.id, start, end)
  const sq = Statistics.attributed_carbs_simple(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )

  let carbs = await db.with(sq).select().from(sq)
  

  carbs = carbs
    .filter(
      (carb) =>
        carb.id !== -1 &&
        carb.timestamp.getTime() >= start.getTime() &&
        carb.timestamp.getTime() <= end.getTime()
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  return carbs
}
