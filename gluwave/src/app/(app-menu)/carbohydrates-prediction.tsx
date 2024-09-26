import { validateRequest } from '@/auth'
import { Plot } from '@/components/plot'
import { Statistics } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

export const CarbohydratesPrediction = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(now, 18)
  const end = addHours(now, 0)
  const data = await Statistics.observed_carbs_on_board(
    user.id,
    user.carbohydrateRatio,
    user.correctionRatio,
    start,
    end
  )

  const observed_carbs = await Statistics.execute(
    Statistics.observed_carbs(
      Statistics.range_timeframe(start, end),
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  // console.log(
  //   data.filter((d) => d.id == 61).reduce((acc, curr) => acc + curr.observed, 0)
  // )

  return (
    <div className="bg-white">
      <Plot
        data={data.map((d) => {
          return {
            x: d.timestamp,
            y: d.carbs_on_board,
          }
        })}
      />
    </div>
  )
}