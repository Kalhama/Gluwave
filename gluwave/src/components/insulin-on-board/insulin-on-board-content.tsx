'use client'

import { calculateUserInsulinData } from '@/lib/sql_utils'
import { DomainTuple, VictoryArea, VictoryLine } from 'victory'

import { GraphContent } from '../graph-container'

interface Props {
  data: {
    x: Date
    y: number
  }[]
  now: Date
}

export const InsulinOnBoardContent = ({ data, now }: Props) => {
  const domain = {
    y: [
      0,
      Math.max(5.5, ...data.map((insulin) => insulin.y)) + 2,
    ] as DomainTuple,
    x: [
      new Date(Math.min(...data.map((d) => d.x.getTime()))),
      new Date(Math.max(...data.map((d) => d.x.getTime()))),
    ] as DomainTuple,
  }

  return (
    <GraphContent domain={domain} now={now} height={150}>
      <VictoryLine
        style={{
          data: {
            strokeDasharray: '2 2',
            strokeWidth: 1,
            stroke: '#c43a31',
          },
        }}
        data={[
          { x: now, y: 0 },
          { x: now, y: 100 },
        ]}
      />
      <VictoryArea
        style={{
          /* tailwind red-700 */
          data: { fill: '#b91c1c33', stroke: '#b91c1c', strokeWidth: 2 },
          parent: { border: '1px solid #ccc', padding: 0 },
        }}
        data={data}
      />
    </GraphContent>
  )
}
