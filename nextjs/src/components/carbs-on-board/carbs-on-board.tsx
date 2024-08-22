'use client'

import { calculateUserCarbsData } from '@/lib/sql_utils'
import { addHours, addMinutes, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

type CarbsData = Awaited<ReturnType<typeof calculateUserCarbsData>>
type CarbsDataItem = CarbsData[0]

interface Props {
  data: CarbsData
}

export const CarbsOnBoard = ({ data }: Props) => {
  const now = new Date()

  const yDomain = [
    0,
    Math.max(10, ...data.map((carb) => carb.carbsOnBoard)) + 10,
  ] as DomainTuple

  const current = data.find(
    (carb) => carb.timestamp > now && carb.timestamp <= addMinutes(now, 1)
  )

  return (
    <div className="space-y-4">
      <div className="border rounded-sm">
        <div className="flex flex-row justify-between items-center pt-4 px-4">
          <h2 className="font-semibold">Carbs</h2>
          <Link href="/carbs/list">
            <div className="flex items-center">
              <span className="mt-0 text-sm">
                {(current?.carbsOnBoard ?? 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })}{' '}
                g
              </span>
              <ChevronRight />
            </div>
          </Link>
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
              data={data}
              x="timestamp"
              y="carbsOnBoard"
            />
          </VictoryChart>
        </div>
      </div>
    </div>
  )
}
