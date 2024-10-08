import { db } from '@/db'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { RouteProps } from './RouteProps'
import { ZPostProfileSchema } from './post-profile.schema'

export const postProfile = async ({
  ctx: { user },
  input,
}: RouteProps<z.infer<typeof ZPostProfileSchema>>) => {
  await db
    .update(userTable)
    .set({
      carbohydrateRatio: input.carbohydrateRatio,
      correctionRatio: input.correctionRatio,
      target: input.target,
      insulinOnBoardOffset: input.insulinOnBoardOffset,
    })
    .where(eq(userTable.id, user.id))
}
