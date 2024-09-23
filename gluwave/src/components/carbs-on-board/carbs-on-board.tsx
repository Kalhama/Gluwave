'use client'

import { calculateUserCarbsData, observedCarbs } from '@/lib/sql_utils'
import { addHours, addMinutes, subHours } from 'date-fns'
import { DomainTuple, Tuple, VictoryArea, VictoryLine } from 'victory'

import { GraphContainer, GraphContent, GraphTitle } from '../graph-container'

interface Props {
  now: Date
  observed: Awaited<ReturnType<typeof observedCarbs>>
  predicted: Awaited<ReturnType<typeof calculateUserCarbsData>>
  domain: {
    x: Tuple<Date>
    y: DomainTuple
  }
}

export const CarbsOnBoard = ({ now, observed, predicted, domain }: Props) => {
  const current = predicted.find(
    (c) => now < c.timestamp && addMinutes(now, 1) >= c.timestamp
  )

  return (
    <GraphContainer>
      <GraphTitle href="/carbs/list" className="flex justify-between">
        <div>
          <h2 className="font-semibold">
            Observed and predicted carbohydrates
          </h2>
          <span className="text-xs">
            COB{' '}
            {current?.carbsOnBoard.toLocaleString(undefined, {
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>
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
    </GraphContainer>
  )
}
