'use client'

import { getCarbsOnBoardAction } from '@/actions/get-carbs-on-board'
import { getObservedCarbsAction } from '@/actions/get-observed-carbs'
import { useServerAction } from '@/lib/use-server-action'
import { addHours, addMinutes, setHours, startOfDay, subHours } from 'date-fns'
import { useEffect } from 'react'
import { DomainTuple, VictoryChart, VictoryLine, VictoryTheme } from 'victory'

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

  useEffect(() => {
    const now = new Date()
    const start = setHours(startOfDay(subHours(now, 4)), 4) // previous 4AM
    const end = addHours(now, 6)

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

  const now = new Date()

  if (observedLoading || !observedCarbs || COBLoading || !carbsOnBoard)
    return 'loading...'

  const current = carbsOnBoard.find(
    (c) => now < c.timestamp && addMinutes(now, 1) >= c.timestamp
  )

  const yDomain = [
    Math.min(
      ...carbsOnBoard.map((c) => c.cumulativeDecayedCarbs),
      ...observedCarbs.map((c) => c.cumulative_observed_carbs)
    ) - 5,
    Math.max(
      ...carbsOnBoard.map((c) => c.cumulativeDecayedCarbs),
      ...observedCarbs.map((c) => c.cumulative_observed_carbs)
    ) + 5,
  ] as DomainTuple

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
      <GraphContent>
        <VictoryChart
          padding={{ top: 10, bottom: 25, left: 35, right: 15 }}
          height={200}
          domain={{
            y: yDomain,
          }}
          // containerComponent={
          //   <VictoryZoomContainer
          //     allowZoom={false}
          //     // zoomDomain={{
          //     //   x: [subHours(new Date(), 2), addHours(new Date(), 2)],
          //     // }}
          //   />
          // }
          theme={VictoryTheme.material}
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
              { x: now, y: 0 },
              { x: now, y: 5000 },
            ]}
          />
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
          <VictoryLine
            style={{
              data: { stroke: '#c43a31' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={carbsOnBoard}
            x="timestamp"
            y="cumulativeDecayedCarbs"
          />
        </VictoryChart>
      </GraphContent>
    </GraphContainer>
  )
}
