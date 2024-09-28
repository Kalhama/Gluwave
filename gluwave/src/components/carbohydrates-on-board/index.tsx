import { validateRequest } from '@/auth'
import { db } from '@/db'
import { Statistics } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbohydratesOnBoardGraph } from './carbohydrates-on-board-graph'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const latestBloodGlucose = now // TODO
  const start = subHours(now, 18)
  const end = addHours(now, 6)

  const attributed_carbs = await Statistics.observed_carbs_attributed(
    user.id,
    user.carbohydrateRatio,
    user.correctionRatio,
    start,
    latestBloodGlucose
  )
  const observed = await Statistics.observed_carbs_on_board(attributed_carbs)

  const t = new Date()
  const prediction = await Statistics.execute(
    await Statistics.predict_carbs_on_board(
      attributed_carbs,
      latestBloodGlucose,
      end
    )
  )
  console.log(`took ${new Date().getTime() - t.getTime()}ms`)

  const union = [...observed, ...prediction]

  const current = union.find(
    (d) => Math.abs(d.timestamp.getTime() - now.getTime()) < 1000 * 60 * 1
  )

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrates on board</h2>
          <span className="text-xs">
            Current{' '}
            {current?.carbs_on_board.toLocaleString([], {
              maximumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
      <CarbohydratesOnBoardGraph
        domain={{
          x: [start, end],
          y: [0, Math.max(...union.map((d) => d.carbs_on_board + 10))],
        }}
        now={now}
        data={union.map((d) => {
          return {
            x: d.timestamp,
            y: d.carbs_on_board,
          }
        })}
      />
    </GraphContainer>
  )
}
