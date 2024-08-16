import { z } from 'zod'

export const addGlucoseSchema = z.object({
  timedelta: z.number().lte(0).gt(-300),
  value: z.string(),
})
