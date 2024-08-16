'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

interface Props {
  data: Awaited<ReturnType<typeof calculateUserCarbsData>>
}

export const CarbsOnBoard = ({ data }: Props) => {
  const now = new Date()
  const formattedData = data.map((d) => {
    return {
      x: d.timestamp,
      y: d.carbsOnBoard,
    }
  })

  const yDomain = [
    0,
    Math.max(10, ...data.map((carb) => carb.carbsOnBoard)),
  ] as DomainTuple

  return (
    <div className="space-y-4">
      <div className="border rounded-sm">
        <div className="flex flex-row justify-between items-center pt-4 px-4">
          <h2 className="font-semibold">Carbs</h2>
          <span className="mt-0 text-sm">TODO g</span>
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
              data={formattedData}
            />
          </VictoryChart>
        </div>
      </div>
    </div>
  )
}
