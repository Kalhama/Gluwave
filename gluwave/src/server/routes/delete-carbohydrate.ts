import { db } from '@/db'
import { carbs } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeteleCarbohydrateSchema = z.object({
  id: z.number(),
})

export const deleteCarbohydrate = async ({
  ctx: { user },
  input: { id },
}: RouteProps<z.infer<typeof ZDeteleCarbohydrateSchema>>) => {
  await db.delete(carbs).where(and(eq(carbs.userId, user.id), eq(carbs.id, id)))

  return id
}
