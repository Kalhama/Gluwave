import { db } from '@/db'
import { insulin } from '@/schema'
import { eachMinuteOfInterval, startOfMinute } from 'date-fns'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import pl, { Datetime, Float64 } from 'nodejs-polars'

export const inuslin_on_board = async (
  userId: string,
  start: Date,
  end: Date
) => {
  const insunlin = await db
    .select()
    .from(insulin)
    .where(
      and(
        eq(insulin.userId, userId),
        gte(sql`insulin.timestamp + interval '8 hours'`, start),
        lte(insulin.timestamp, end)
      )
    )

  const timeframe = pl.DataFrame(
    {
      timestamp: eachMinuteOfInterval({ start: startOfMinute(start), end }),
    },
    {
      schema: {
        timestamp: Datetime('ms'),
      },
    }
  )

  // Convert meals array to a Polars DataFrame
  const insulinDF = pl.DataFrame(
    {
      timestamp: insunlin.map((m) => m.timestamp),
      insulin: insunlin.map((m) => m.amount),
    },
    {
      schema: {
        timestamp: Datetime('ms'),
        insulin: Float64,
      },
    }
  )

  const crossJoined = timeframe
    .join(insulinDF, { how: 'cross' })
    .filter(pl.col('timestamp').gt(pl.col('timestamp_right')))

  const iob = crossJoined
    .withColumn(
      pl
        .col('timestamp')
        .sub(pl.col('timestamp_right'))
        .cast(pl.Int64)
        .div(60 * 1000)
        .as('minutes_diff')
    )
    .withColumn(
      pl
        .col('insulin')
        .minus(
          pl
            .col('minutes_diff')
            .div(55)
            .add(1)
            .mul(pl.col('minutes_diff').div(-55).exp())
            .mul(-1)
            .add(1)
            .mul(pl.col('insulin'))
        )
        .as('iob')
    )
    .groupBy('timestamp')
    .agg(pl.col('iob').sum().alias('iob'))
    .sort('timestamp')

  console.log(iob)

  return iob
}
