import { db } from '@/db'
import { insulin } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'
import { ZPostInsulinSchema } from './post-insulin.schema'

export const postInsulin = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZPostInsulinSchema>>) => {
  if (input.id) {
    await db
      .update(insulin)
      .set({
        amount: input.amount,
        timestamp: input.timestamp,
      })
      .where(and(eq(insulin.userId, user.id), eq(insulin.id, input.id)))
  } else {
    await db.insert(insulin).values({
      amount: input.amount,
      timestamp: input.timestamp,
      userId: user.id,
    })
  }
}
