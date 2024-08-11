import { db } from '@/db'
import { insulin } from '@/schema'
import { parseISO } from 'date-fns'
import { gte, sql } from 'drizzle-orm'
import { timestamp } from 'drizzle-orm/pg-core'

// TODO should filter by user
export const IOB = async () => {
  const data = await db.execute(
    sql`
    WITH minutes AS (
      SELECT generate_series(
        ( SELECT min(date_trunc('minute'::text, insulin."timestamp")) AS min
                FROM insulin), ( SELECT max(insulin."timestamp") + '06:00:00'::interval
                FROM insulin), '00:01:00'::interval) AS "timestamp"
     ), insulin_on_board AS (
      SELECT minutes."timestamp",
         sum(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) THEN insulin.amount::numeric * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0 / 55::numeric + 1::numeric) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                 ELSE 0::numeric
             END) AS insulin_on_board
        FROM minutes
          LEFT JOIN insulin ON minutes."timestamp" >= insulin."timestamp"
       GROUP BY minutes."timestamp"
       ORDER BY minutes."timestamp"
     ), iac AS (
      SELECT minutes."timestamp",
         sum(
             CASE
                 WHEN minutes."timestamp" >= insulin."timestamp" AND minutes."timestamp" < (insulin."timestamp" + '06:00:00'::interval) THEN insulin.amount::numeric * 0.000331 * (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0) * exp((- (EXTRACT(epoch FROM minutes."timestamp" - insulin."timestamp") / 60.0)) / 55::numeric)
                 ELSE 0::numeric
             END) AS iob
        FROM minutes
          LEFT JOIN insulin ON minutes."timestamp" >= insulin."timestamp"
       GROUP BY minutes."timestamp"
       ORDER BY minutes."timestamp"
     )
  SELECT "timestamp",
  insulin_on_board
  FROM insulin_on_board;
    `
  )
  const results = data.rows.map((el) => {
    return {
      timestamp: parseISO(el.timestamp as any),
      insulinOnBoard: el.insulin_on_board as string,
    }
  })

  return results
}
