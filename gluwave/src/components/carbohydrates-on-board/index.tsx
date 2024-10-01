import { validateRequest } from '@/auth'
import { carbs_on_board, carbs_on_board_prediction } from '@/lib/cob'
import { addHours, differenceInMinutes, subHours, subMinutes } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { CarbohydratesOnBoardGraph } from './carbohydrates-on-board-graph'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(now, 24)
  const end = addHours(now, 10)

  const observed = await carbs_on_board(user.id, start, end)

  const predicted = await carbs_on_board_prediction(user.id, start, end)

  const union = [
    { timestamp: subMinutes(observed[0]?.timestamp ?? now, 1), cob: 0 }, // start from 0 for nicer plot
    ...observed,
    ...predicted,
  ]

  const current =
    union.find((d) => Math.abs(differenceInMinutes(d.timestamp, now)) < 3)
      ?.cob ?? 0

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
          y: [0, Math.max(...union.map((d) => d.cob + 10))],
        }}
        now={now}
        data={union.map((d) => {
          return {
            x: d.timestamp,
            y: d.cob,
          }
        })}
      />
    </GraphContainer>
  )
}
