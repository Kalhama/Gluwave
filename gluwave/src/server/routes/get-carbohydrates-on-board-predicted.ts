import { carbs_on_board_prediction } from '@/server/services/cob'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetCarbohydratesOnBoardPredictedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getCarbohydratesOnBoardPredicted = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydratesOnBoardPredictedSchema>>) => {
  const r = await carbs_on_board_prediction(user.id, start, end)

  const test = r.toRecords()

  return r.toRecords()
}
