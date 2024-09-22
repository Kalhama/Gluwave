'use client'

import { getCarbsOnBoardAction } from '@/actions/get-carbs-on-board'
import { getObservedCarbsAction } from '@/actions/get-observed-carbs'
import { useServerAction } from '@/lib/use-server-action'
import { addHours, addMinutes, setHours, startOfDay, subHours } from 'date-fns'
import { useEffect } from 'react'
import { Tuple, VictoryLine } from 'victory'

import { GraphContainer, GraphContent, GraphTitle } from './graph-container'

interface Props {}

export const CarbsOnBoard = ({}: Props) => {
  const {
    action: observedAction,
    data: observedCarbs,
    loading: observedLoading,
  } = useServerAction(getObservedCarbsAction)

  const {
    action: COBAction,
    data: carbsOnBoard,
    loading: COBLoading,
  } = useServerAction(getCarbsOnBoardAction)

  const now = new Date()
  const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
  const end = addHours(now, 6)
  useEffect(() => {
    observedAction({
      start,
      end,
    })

    COBAction({
      start,
      end,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (observedLoading || !observedCarbs || COBLoading || !carbsOnBoard)
    return 'loading...'

  const current = carbsOnBoard.find(
    (c) => now < c.timestamp && addMinutes(now, 1) >= c.timestamp
  )

  const domain = {
    y: [
      Math.min(
        ...carbsOnBoard.map((c) => c.cumulativeDecayedCarbs),
        ...observedCarbs.map((c) => c.cumulative_observed_carbs)
      ) - 5,
      Math.max(
        ...carbsOnBoard.map((c) => c.cumulativeDecayedCarbs),
        ...observedCarbs.map((c) => c.cumulative_observed_carbs)
      ) + 5,
    ] as Tuple<number>,
    x: [start, end] as Tuple<Date>,
  }

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
      <GraphContent yDomain={domain.y} now={now}>
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
            { x: now, y: 5000 },
          ]}
        />
        {observedCarbs.length !== 0 && (
          <VictoryLine
            style={{
              data: { stroke: '#111111' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            interpolation="stepAfter"
            data={observedCarbs}
            x="timestamp"
            y="cumulative_observed_carbs"
          />
        )}
        {observedCarbs.length !== 0 && (
          <VictoryLine
            style={{
              data: { stroke: '#c43a31' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={carbsOnBoard}
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
