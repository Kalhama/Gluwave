import { Statistics } from '@/server/services/sql_utils'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetCarbohydratesRateObservedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const ZGetCarbohydratesRateObservedOutputSchema = z.array(
  z.object({
    timestamp: z.date(),
    glucose: z.number(),
    cumulativeInsulin: z.number(),
    observedCarbs: z.number(),
    interval: z.number(),
  })
)

export const getCarbohydratesRateObserved = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydratesRateObservedSchema>>) => {
  const tf = Statistics.approximate_timeframe(user.id, start, end)

  const observed = await Statistics.execute(
    Statistics.observed_carbs(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  return observed
}
