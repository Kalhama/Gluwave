import { z } from 'zod'

export const addInsulinSchema = z.object({
  timedelta: z.coerce.number().lte(0).gt(-300),
  amount: z.preprocess(
    (v) => parseFloat(String(v).replace(',', '.')),
    z.number().gt(0).lt(50)
  ),
})
