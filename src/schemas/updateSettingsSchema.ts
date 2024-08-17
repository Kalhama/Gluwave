import { z } from 'zod'

export const updateSettingsSchema = z.object({
  carbsPerUnits: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0)
  ),
  adjustmentRate: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0)
  ),
  target: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0).lt(50)
  ),
  insulinOnBoardOffset: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0)
  ),
  id: z.string(),
})
