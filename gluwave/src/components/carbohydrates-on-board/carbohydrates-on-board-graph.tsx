'use client'

import { addHours } from 'date-fns'
import { DomainTuple, Tuple, VictoryArea, VictoryLine } from 'victory'

import { GraphContent } from '../graph-container'

interface Props {
  now: Date
  data: {
    x: Date
    y: number
  }[]
  domain: {
    x: DomainTuple
    y: DomainTuple
  }
}

export const CarbohydratesOnBoardGraph = ({ now, data, domain }: Props) => {
  const initialZoomDomain = {
    x: [addHours(now, -3), addHours(now, 3)] as Tuple<Date>,
  }

  return (
    <GraphContent
      initialZoomDomain={initialZoomDomain}
      domain={domain}
      now={now}
    >
      <VictoryLine
        style={{
          data: {
            strokeDasharray: '2 2',
            strokeWidth: 1,
            stroke: '#c43a31',
          },
        }}
        data={[
          { x: now, y: -5000 },
          { x: now, y: 5000 },
        ]}
      />
      <VictoryArea
        style={{
          /* tailwind green-700 */
          data: { fill: '#15803d88' },
        }}
        interpolation="stepAfter"
        data={data}
      />
    </GraphContent>
  )
}
