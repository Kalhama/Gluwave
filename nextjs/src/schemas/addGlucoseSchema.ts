import { parseCommaFloat } from '@/lib/parse-comma-float'
import { z } from 'zod'

export const addGlucoseSchema = z.object({
  timedelta: z.coerce.number().lte(0).gt(-300),
  value: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(50)),
})
