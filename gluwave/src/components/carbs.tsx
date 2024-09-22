'use client'

import { getObservedCarbsAction } from '@/actions/get-observed-carbs'
import { useServerAction } from '@/lib/use-server-action'
import { addHours, setHours, startOfDay, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

interface Props {}

export const Carbs = ({}: Props) => {
  const {
    action,
    data: observedCarbs,
    loading,
  } = useServerAction(getObservedCarbsAction)

  useEffect(() => {
    const now = new Date()
    const start = setHours(startOfDay(subHours(now, 4)), 4)
    const end = addHours(start, 24)

    action({
      start,
      end,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const now = new Date()

  if (loading || !observedCarbs) return 'loading...'

  const yDomain = [
    Math.min(...observedCarbs.map((carb) => carb.observed_carbs_rate)) - 2,
    Math.max(...observedCarbs.map((carb) => carb.observed_carbs_rate)) + 2,
  ] as DomainTuple

  const last = observedCarbs[observedCarbs.length - 1]

  return (
    <div>
      <div className="pt-2 px-4">
        <div className="flex flex-row justify-between items-center">
          <h2 className="font-semibold">Observed carbs</h2>
          <Link href="/carbs/list">
            <div className="flex items-center">
              <span className="mt-0 text-sm">
                Observed today{' '}
                {(last?.cumulative_observed_carbs ?? 0).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  }
                )}{' '}
                g
              </span>
              <ChevronRight />
            </div>
          </Link>
        </div>
        <span className="text-sm">Normalized to 15m</span>
      </div>
      <div className="p-2">
        <VictoryChart
          padding={{ top: 10, bottom: 25, left: 30, right: 15 }}
          height={200}
          // domain={{
          //   y: yDomain,
          // }}
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
          {/* empty chart in case there is no other data, so that x axis remains stable */}
          {/* <VictoryLine
            data={[
              { x: subHours(now, 24), y: null },
              { x: addHours(now, 24), y: null },
            ]}
          /> */}
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
          {observedCarbs.length !== 0 && (
            <VictoryLine
              style={{
                data: { stroke: '#c43a31' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              interpolation="stepBefore"
              data={observedCarbs}
              x="timestamp"
              y="observed_carbs_rate"
            />
          )}
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
        </VictoryChart>
      </div>
    </div>
  )
}
