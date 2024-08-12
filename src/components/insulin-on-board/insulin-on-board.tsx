'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { calculateUserInsulinData } from '@/lib/sql_utils'
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory'

interface Props {
  data: Awaited<ReturnType<typeof calculateUserInsulinData>>
}

export const InsulinOnBoard = ({ data }: Props) => {
  const formattedData = data.map((d) => {
    return {
      x: d.timestamp,
      y: d.insulinOnBoard,
    }
  })
  return (
    <div className="space-y-4">
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
    </div>
  )
}
