import { parseCommaFloat } from '@/lib/parse-comma-float'
import { z } from 'zod'

export const upsertInsulinSchema = z.object({
  timestamp: z.date(),
  amount: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(50)),
  id: z.number().optional(),
})
