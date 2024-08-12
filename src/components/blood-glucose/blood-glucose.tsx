'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { addHours, subHours } from 'date-fns'
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

interface Props {
  data: {
    timestamp: Date
    value: number
  }[]
}

export const BloodGlucose = ({ data }: Props) => {
  const now = new Date()
  const formattedData = data.map((d) => {
    return {
      x: d.timestamp,
      y: d.value,
    }
  })
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Blood Glucose</CardTitle>
          <CardDescription>
            Blood glucose measurements over time
          </CardDescription>
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
                { x: now, y: 16 },
              ]}
            />
            <VictoryScatter
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
