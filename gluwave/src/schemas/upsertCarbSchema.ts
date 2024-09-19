import { parseCommaFloat } from '@/lib/parse-comma-float'
import { z } from 'zod'

export const upsertCarbSchema = z.object({
  timestamp: z.date(),
  carbs: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(1000)),
  decay: z.number().gt(0).lte(720),
  id: z.number().optional(),
})
