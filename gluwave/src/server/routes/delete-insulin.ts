import { db } from '@/db'
import { insulin } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'

export const ZDeleteInsulinSchema = z.object({
  id: z.number(),
})

export const deleteInsulin = async ({
  ctx: { user },
  input: { id },
}: RouteProps<z.infer<typeof ZDeleteInsulinSchema>>) => {
  await db
    .delete(insulin)
    .where(and(eq(insulin.userId, user.id), eq(insulin.id, id)))

  return id
}
