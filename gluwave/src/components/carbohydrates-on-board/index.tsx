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

  return 'TODO'

  // return (
  //   <GraphContainer>
  //     <GraphTitle href="/carbs/list" className="flex justify-between">
  //       <div>
  //         <h2 className="font-semibold">Carbohydrates on board</h2>
  //         <span className="text-xs">
  //           Current{' '}
  //           {/* {current?.carbs_on_board.toLocaleString([], {
  //             maximumFractionDigits: 0,
  //           })}{' '} */}
  //           g
  //         </span>
  //       </div>
  //     </GraphTitle>
  //     <CarbohydratesOnBoardGraph
  //       domain={{
  //         x: [start, end],
  //         y: [0, Math.max(...data.map((d) => d.carbs_on_board + 10))],
  //       }}
  //       now={now}
  //       data={data.map((d) => {
  //         return {
  //           x: parseISO(d.timestamp),
  //           y: d.carbs_on_board,
  //         }
  //       })}
  //     />
  //   </GraphContainer>
  // )
}
