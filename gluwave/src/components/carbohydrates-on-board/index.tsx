import { validateRequest } from '@/auth'
import { Statistics } from '@/lib/sql_utils'
import { parseISO } from 'date-fns'
import { redirect } from 'next/navigation'

import { Plot } from '../plot'

export const CarbohydratesOnBoard = async () => {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const t = new Date()
  const data = await Statistics.carbs_on_board()

  console.log(data.slice(-10))
  console.log(`took ${new Date().getTime() - t.getTime()}ms`)

  console.log(data)

  return (
    <>
      <Plot
        data={data.map((e) => {
          return {
            x: parseISO(e.timestamp),
            y: e.carbs_on_board,
          }
        })}
      />
    </>
  )

  // const union = [...observed, ...prediction]

  // const current = union.find(
  //   (d) => Math.abs(d.timestamp.getTime() - now.getTime()) < 1000 * 60 * 1
  // )

  // return (
  //   <GraphContainer>
  //     <GraphTitle href="/carbs/list" className="flex justify-between">
  //       <div>
  //         <h2 className="font-semibold">Carbohydrates on board</h2>
  //         <span className="text-xs">
  //           Current{' '}
  //           {current?.carbs_on_board.toLocaleString([], {
  //             maximumFractionDigits: 0,
  //           })}{' '}
  //           g
  //         </span>
  //       </div>
  //     </GraphTitle>
  //     <CarbohydratesOnBoardGraph
  //       domain={{
  //         x: [start, end],
  //         y: [0, Math.max(...union.map((d) => d.carbs_on_board + 10))],
  //       }}
  //       now={now}
  //       data={union.map((d) => {
  //         return {
  //           x: d.timestamp,
  //           y: d.carbs_on_board,
  //         }
  //       })}
  //     />
  //   </GraphContainer>
  // )
}
