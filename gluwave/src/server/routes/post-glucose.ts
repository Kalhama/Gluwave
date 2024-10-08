import { db } from '@/db'
import { glucose } from '@/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'
import { ZPostGlucoseSchema } from './post-glucose.schema'

export const postGlucose = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZPostGlucoseSchema>>) => {
  if (input.id) {
    await db
      .update(glucose)
      .set({
        value: input.value,
        timestamp: input.timestamp,
      })
      .where(and(eq(glucose.userId, user.id), eq(glucose.id, input.id)))
  } else {
    await db.insert(glucose).values({
      value: input.value,
      timestamp: input.timestamp,
      userId: user.id,
    })
  }
}
