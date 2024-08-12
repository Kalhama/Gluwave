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
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Carbs on board</CardTitle>
          <CardDescription>Carbs on board over time</CardDescription>
        </CardHeader>
        <CardContent>
          <VictoryChart
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
        </CardContent>
        {/* <CardFooter></CardFooter> */}
      </Card>
    </div>
  )
}
