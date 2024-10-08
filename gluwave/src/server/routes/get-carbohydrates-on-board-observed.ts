import { carbs_on_board } from '@/server/services/cob'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZGetCarbohydratesOnBoardObservedSchema = z.object({
  start: z.date(),
  end: z.date(),
})

export const getCarbohydratesOnBoardObserved = async ({
  ctx: { user },
  input: { start, end },
}: RouteProps<z.infer<typeof ZGetCarbohydratesOnBoardObservedSchema>>) => {
  return await carbs_on_board(user.id, start, end)
}
