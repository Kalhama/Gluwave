'use client'

import { observedCarbs } from '@/lib/sql_utils'
import { addHours, addMinutes, parseISO, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

type CarbsData = Awaited<ReturnType<typeof observedCarbs>>
type CarbsDataItem = CarbsData[0]

interface Props {
  observedCarbs: CarbsData
}

export const Carbs = ({ observedCarbs }: Props) => {
  const now = new Date()

  // timestamp is always the beginning of a group, so when we add a dummy element with current time we essentially tell when the predicitons end

  // TODO actually we need to use last bg measuremetn timestamp...

  // observedCarbs.push({
  //   timestamp: new Date(),
  //   interval_length: 0,
  //   glucose_change: 0,
  //   insulin_decay: 0,
  //   observed_carbs: 0,
  // })
  // observedCarbs.push({
  //   ...observedCarbs[observedCarbs.length - 1],
  //   timestamp: new Date(),
  // })

  // observedCarbs = observedCarbs.filter(
  //   (d) => d.timestamp < parseISO('2024-08-22T02:34:32.999Z')
  // )

  const yDomain = [
    Math.min(...observedCarbs.map((carb) => carb.observed_carbs)),
    Math.max(1, ...observedCarbs.map((carb) => carb.observed_carbs)),
  ] as DomainTuple

  // const current = carbsOnBoard.find(
  //   (carb) => carb.timestamp > now && carb.timestamp <= addMinutes(now, 1)
  // )

  return (
    <div className="space-y-4">
      <div className="border rounded-sm">
        <div className="pt-4 px-4">
          <div className="flex flex-row justify-between items-center">
            <h2 className="font-semibold">Observed carbs</h2>
            <Link href="/carbs/list">
              <div className="flex items-center">
                {/* <span className="mt-0 text-sm">
                  {(current?.carbsOnBoard ?? 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })}{' '}
                </span> */}
                <ChevronRight />
              </div>
            </Link>
          </div>
          <span className="text-sm">Normalized to 15m</span>
        </div>
        <div className="p-2">
          <VictoryChart
            padding={{ top: 15, bottom: 30, left: 30, right: 15 }}
            height={200}
            domain={{
              y: yDomain,
            }}
            containerComponent={
              <VictoryZoomContainer
                allowZoom={false}
                zoomDomain={{
                  x: [subHours(new Date(), 2), addHours(new Date(), 2)],
                }}
              />
            }
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
                { x: now, y: 100 },
              ]}
            />
            <VictoryLine
              style={{
                data: { stroke: '#c43a31' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              interpolation="stepAfter"
              data={observedCarbs}
              x="timestamp"
              y="observed_carbs"
            />
            {/* empty chart in case there is no other data, so that x axis remains stable */}
            <VictoryLine
              data={[
                { x: subHours(now, 24), y: null },
                { x: addHours(now, 24), y: null },
              ]}
            />
          </VictoryChart>
        </div>
      </div>
    </div>
  )
}
