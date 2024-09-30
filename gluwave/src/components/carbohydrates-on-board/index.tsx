import { validateRequest } from '@/auth'
import { Statistics } from '@/lib/sql_utils'
import { addHours, differenceInMinutes, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbohydratesOnBoardGraph } from './carbohydrates-on-board-graph'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  // TODO pick start and end carefully
  const now = new Date()
  const start = subHours(now, 24)
  const end = addHours(now, 24)

  const observed = await Statistics.get_carbs_on_board(user.id, start, end)
  const predicted = await Statistics.get_carbs_on_board_prediction(
    user.id,
    start,
    end
  )

  const data = [...observed, ...predicted]

  const current =
    data.find((d) => Math.abs(differenceInMinutes(d.timestamp, now)) < 5)
      ?.cob ?? 0

  // TODO adjust domain
  // TODO interpolate step something

  // TODO stroke prediction with dash

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrates on board</h2>
          <span className="text-xs">
            Current{' '}
            {current.toLocaleString([], {
              maximumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
      <CarbohydratesOnBoardGraph
        domain={{
          x: [start, end],
          y: [0, Math.max(...data.map((d) => d.cob + 10))],
        }}
        now={now}
        data={data.map((d) => {
          return {
            x: d.timestamp,
            y: d.cob,
          }
        })}
      />
    </GraphContainer>
  )
}
