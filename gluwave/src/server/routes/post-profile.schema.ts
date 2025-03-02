import { parseCommaFloat } from '@/lib/parse-comma-float'
import { userTable } from '@/schema'
import { z } from 'zod'

export const ZPostProfileSchema = z.object({
  carbohydrateRatio: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0)),
  correctionRatio: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0)),
  target: z.preprocess((v) => parseCommaFloat(v), z.number().gt(0).lt(50)),
  insulinOnBoardOffset: z.preprocess(
    (v) => parseCommaFloat(v),
    z.number().gte(-5).lte(5)
  ),
})

export const ZPostProfileOutputSchema = z.void()
