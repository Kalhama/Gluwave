import { validateRequest } from '@/auth'
import { Statistics } from '@/lib/sql_utils'
import { addHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbohydratesOnBoardGraph } from './carbohydrates-on-board-graph'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }
  const now = new Date()
  const start = addHours(now, -8)
  const end = addHours(now, 0.2)
  const tf = Statistics.range_timeframe(start, end)
  const carbs_on_board = await Statistics.execute(
    Statistics.observed_carbs_on_board(
      tf,
      user.id,
      user.carbohydrateRatio,
      user.correctionRatio
    )
  )

  const current = carbs_on_board.find(
    (d) => Math.abs(d.timestamp.getTime() - now.getTime()) < 1000 * 60 * 1
  )

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrates on board</h2>
          <span className="text-xs">
            Current{' '}
            {current?.observed_carbs_on_board.toLocaleString([], {
              maximumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
      <CarbohydratesOnBoardGraph
        domain={{
          x: [start, end],
          y: [
            0,
            Math.max(
              ...carbs_on_board.map((d) => d.observed_carbs_on_board + 10)
            ),
          ],
        }}
        now={now}
        data={carbs_on_board.map((d) => {
          return {
            x: d.timestamp,
            y: d.observed_carbs_on_board,
          }
        })}
      />
    </GraphContainer>
  )
}
