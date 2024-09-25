import { validateRequest } from '@/auth'
import { Plot } from '@/components/plot'
import { Statistics } from '@/lib/sql_utils'
import { carbs } from '@/schema'
import { addHours, subHours } from 'date-fns'
import { timestamp } from 'drizzle-orm/pg-core'
import { User } from 'lucia'
import { redirect } from 'next/navigation'

export const CarbohydratesPrediction = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(now, 24)
  const end = addHours(now, 0.5)
  const data = await Statistics.carbs_join_observed(
    Statistics.range_timeframe(start, end),
    user.id,
    user.correctionRatio,
    user.carbohydrateRatio
  )

  return (
    <div className="bg-white">
      <Plot
        data={data
          .filter((d) => d.id == 60)
          .map((d) => {
            return {
              x: d.timestamp,
              y: d.cumulative_attributed_carbs,
            }
          })}
      />
    </div>
  )
}
