import { z } from 'zod'

export const updateSettingsSchema = z.object({
  carbohydrateRatio: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0)
  ),
  correctionRatio: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0)
  ),
  target: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0).lt(50)
  ),
  insulinOnBoardOffset: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gte(-5).lte(5)
  ),
})
