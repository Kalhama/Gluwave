'use client'

import { calculateUserCarbsData, observedCarbs } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { DomainTuple, Tuple, VictoryArea, VictoryLine } from 'victory'

import { GraphContent } from '../graph-container'

interface Props {
  now: Date
  observed: Awaited<ReturnType<typeof observedCarbs>>
  predicted: Awaited<ReturnType<typeof calculateUserCarbsData>>
  domain: {
    x: Tuple<Date>
    y: DomainTuple
  }
}

export const CarbsOnBoardContent = ({
  now,
  observed,
  predicted,
  domain,
}: Props) => {
  return (
    <GraphContent domain={domain} now={now}>
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
      {observed.length !== 0 && (
        <VictoryArea
          style={{
            /* tailwind green-700 */
            data: { stroke: '#15803d', fill: '#15803d33', strokeWidth: 2 },
            parent: { border: '1px solid #ccc', padding: 0 },
          }}
          interpolation="stepAfter"
          data={observed}
          x="timestamp"
          y="cumulative_observed_carbs"
        />
      )}
      {predicted.length !== 0 && (
        <VictoryLine
          style={{
            /* tailwind slate-700 */
            data: { stroke: '#334155' },
            parent: { border: '1px solid #ccc', padding: 0 },
          }}
          data={predicted}
          x="timestamp"
          y="cumulativeDecayedCarbs"
        />
      )}

      {/* empty chart in case there is no other data, so that x axis remains stable */}
      <VictoryLine
        data={[
          { x: subHours(now, 24), y: null },
          { x: addHours(now, 24), y: null },
        ]}
      />
    </GraphContent>
  )
}
