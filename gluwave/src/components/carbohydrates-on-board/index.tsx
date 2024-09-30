import { validateRequest } from '@/auth'
import { Statistics } from '@/lib/sql_utils'
import { addHours, parseISO, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { Plot } from '../plot'
import { CarbohydratesOnBoardGraph } from './carbohydrates-on-board-graph'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const start = subHours(now, 24)
  const end = addHours(now, 24)

  const cob = await Statistics.get_carbs_on_board(user.id, start, end)
  const current = cob.slice(-1)[0]

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrates on board</h2>
          <span className="text-xs">
            Current{' '}
            {current?.cob.toLocaleString([], {
              maximumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
      <CarbohydratesOnBoardGraph
        domain={{
          x: [start, end],
          y: [0, Math.max(...cob.map((d) => d.cob + 10))],
        }}
        now={now}
        data={cob.map((d) => {
          return {
            x: d.timestamp,
            y: d.cob,
          }
        })}
      />
    </GraphContainer>
  )
}
