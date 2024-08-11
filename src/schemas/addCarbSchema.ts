import { z } from 'zod'

export const addCarbSchema = z.object({
  timedelta: z.number().lte(300).gt(-300),
  amount: z.number().gt(0).lt(1000),
  decay: z.number().gt(0).lte(720),
})
