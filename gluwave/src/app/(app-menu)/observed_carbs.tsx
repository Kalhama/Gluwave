import { validateRequest } from '@/auth'
import { Plot } from '@/components/plot'
import { Statistics } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

export const ObservedCarbs = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(now, 5)
  const end = addHours(now, 0)

  const observed_carbs = await Statistics.execute(
    Statistics.observed_carbs(
      Statistics.range_timeframe(start, end),
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  return (
    <div className="bg-white">
      <Plot
        data={observed_carbs.map((d) => {
          return {
            x: d.timestamp,
            y: d.observedCarbs,
          }
        })}
      />
    </div>
  )
}
