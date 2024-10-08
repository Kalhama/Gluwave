import { z } from 'zod'

import { Statistics } from '../services/sql_utils'
import { RouteProps } from './RouteProps'

export const ZGetCarbohydrateAttributedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getCarbohydrateAttributed = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydrateAttributedSchema>>) => {
  const tf = Statistics.carbs_timeframe(user.id, start, end)
  let carbs = await Statistics.execute(
    Statistics.attributed_carbs_simple(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

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
