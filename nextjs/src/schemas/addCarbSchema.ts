import { parseCommaFloat } from '@/lib/parse-comma-float'
import { z } from 'zod'

export const addCarbSchema = z.object({
  timedelta: z.coerce.number().lte(300).gt(-300),
  amount: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(1000)),
  decay: z.number().gt(0).lte(720),
})
