import { db } from '@/db'
import { carbs } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'
import { ZPostCarbohydrateSchema } from './post-carbohydrate.schema'

export const postCarbohydrate = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZPostCarbohydrateSchema>>) => {
  if (input.id) {
    await db
      .update(carbs)
      .set({
        amount: input.carbs,
        timestamp: input.timestamp,
        decay: input.decay,
      })
      .where(and(eq(carbs.userId, user.id), eq(carbs.id, input.id)))
  } else {
    await db.insert(carbs).values({
      amount: input.carbs,
      timestamp: input.timestamp,
      decay: input.decay,
      userId: user.id,
    })
  }
}
