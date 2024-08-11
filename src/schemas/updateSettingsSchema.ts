import { z } from 'zod'

export const updateSettingsSchema = z.object({
  carbsPerUnits: z.number().gt(0),
  adjustmentRate: z.number().gt(0),
  target: z.number().gte(4).lte(13),
  insulinOnBoardOffset: z.number(),
  id: z.string(),
})
