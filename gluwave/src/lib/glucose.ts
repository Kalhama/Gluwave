import { db } from '@/db'
import { userTable } from '@/schema'
import { eq } from 'drizzle-orm'
import pl from 'nodejs-polars'

import { carbs_on_board_prediction } from './cob'
import { inuslin_on_board } from './iob'

export const glucose_prediction = async (
  userId: string,
  start: Date,
  end: Date
) => {
  const cob = await carbs_on_board_prediction(userId, start, end)
  const iob = await inuslin_on_board(userId, start, end)

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))

  const j = cob
    .join(iob, { how: 'inner', on: 'timestamp' })
    .withColumn(pl.col('iob').minus(pl.col('iob').first()).as('iob'))
    .withColumn(
      pl
        .col('cumulative_insulin_decay')
        .minus(pl.col('cumulative_insulin_decay').first())
        .as('cumulative_insulin_decay')
    )
    .withColumn(
      pl
        .col('cumulative_carbohydrate_decay')
        .minus(pl.col('cumulative_carbohydrate_decay').first())
        .as('cumulative_carbohydrate_decay')
    )

    .withColumn(
      pl
        .col('cumulative_carbohydrate_decay')
        .mul(pl.lit(user.correctionRatio / user.carbohydrateRatio))
        .as('carbohydrate_prediction')
    )

    .withColumn(
      pl
        .col('cumulative_insulin_decay')
        .mul(pl.lit(user.correctionRatio))
        .mul(pl.lit(-1))
        .as('insulin_prediction')
    )
    .withColumn(
      pl
        .col('cumulative_carbohydrate_decay')
        .mul(pl.lit(user.correctionRatio / user.carbohydrateRatio))
        .minus(
          pl.col('cumulative_insulin_decay').mul(pl.lit(user.correctionRatio))
        )
        .as('prediction')
    )

  return j
}
