'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory'

interface Props {
  data: Awaited<ReturnType<typeof calculateUserCarbsData>>
}

export const CarbsOnBoard = ({ data }: Props) => {
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
          <VictoryChart theme={VictoryTheme.material}>
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
