import { z } from 'zod'

export const addInsulinSchema = z.object({
  timedelta: z.number().lte(0).gt(-300),
  amount: z.number().gt(0).lt(50),
})
