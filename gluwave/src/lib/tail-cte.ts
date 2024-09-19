import { db } from '@/db'
import { WithSubqueryWithSelection } from 'drizzle-orm/pg-core'

export const tailCTE = async (cte: WithSubqueryWithSelection<any, any>) => {
  const query = db.with(cte).select().from(cte)

  console.log(query.toSQL())

  const data = await query

  console.log(data.slice(0, 5))
}
