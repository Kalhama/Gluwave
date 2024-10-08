import { db } from '@/db'
import { insulin } from '@/schema'
import { eachMinuteOfInterval, startOfMinute } from 'date-fns'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import pl, { Datetime, Float64 } from 'nodejs-polars'

import { DataFrameTypes } from './dataframe-with-type'

export const inuslin_on_board = async (
  userId: string,
  start: Date,
  end: Date
) => {
  const i = await db
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
      timestamp: i.map((m) => m.timestamp).concat([start]), // push dummy element to ensure there is always at least one
      insulin: i.map((m) => m.amount).concat([0]),
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
        .col('minutes_diff')
        .div(55)
        .add(1)
        .mul(pl.col('minutes_diff').div(-55).exp())
        .mul(-1)
        .add(1)
        .mul(pl.col('insulin'))
        .as('cumulative_insulin_decay')
    )
    .withColumn(
      pl.col('insulin').minus(pl.col('cumulative_insulin_decay')).as('iob')
    )
    .groupBy('timestamp')
    .agg(
      pl.col('iob').sum().alias('iob'),
      pl.col('cumulative_insulin_decay').sum().alias('cumulative_insulin_decay')
    )
    .sort('timestamp')
    .withColumn(
      pl
        .col('cumulative_insulin_decay')
        .minus(pl.col('cumulative_insulin_decay').first())
        .as('cumulative_insulin_decay')
    )

  return iob as DataFrameTypes<{
    timestamp: Date
    iob: number
    cumulative_insulin_decay: number
  }>
}
