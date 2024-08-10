'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory'

interface Props {
  data: {
    timestamp: Date
    insulinOnBoard: string
  }[]
}

export const InsulinOnBoardChart = ({ data }: Props) => {
  const formattedData = data.map((d) => {
    return {
      x: d.timestamp,
      y: parseFloat(d.insulinOnBoard),
    }
  })
  return (
    <main className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Insulin on board</CardTitle>
          <CardDescription>Insulin on board over time</CardDescription>
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
    </main>
  )
}
