import { parseCommaFloat } from '@/lib/parse-comma-float'
import { z } from 'zod'

export const ZPostGlucoseSchema = z.object({
  timestamp: z.date(),
  value: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(50)),
  id: z.number().optional(),
})

export const ZPostGlucoseOutputSchema = z.void()
