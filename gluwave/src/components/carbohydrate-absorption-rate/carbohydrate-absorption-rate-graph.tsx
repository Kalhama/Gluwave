'use client'

import { addHours } from 'date-fns'
import { DomainTuple, Tuple, VictoryArea, VictoryLine } from 'victory'

import { GraphContent } from '../graph-container'

type ChartData = {
  x: Date
  y: number
}[]

interface Props {
  now: Date
  observed: ChartData
  reported: ChartData
  domain: {
    x: Tuple<Date>
    y: DomainTuple
  }
}

export const CarbohydrateAbsorptionRateGraph = ({
  now,
  observed,
  reported,
  domain,
}: Props) => {
  // for visual purposes
  observed.push({
    y: 0,
    x: addHours(now, 6),
  })

  const initialZoomDomain = {
    x: [addHours(now, -6), addHours(now, 1)] as Tuple<Date>,
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
        data={observed}
      />
      (
      <VictoryArea
        style={{
          /* tailwind slate-700 */
          data: { fill: '#33415588' },
        }}
        interpolation="stepAfter"
        data={reported}
      />
      )
    </GraphContent>
  )
}
