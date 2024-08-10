'use client'

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
    <VictoryChart theme={VictoryTheme.material}>
      <VictoryLine
        style={{
          data: { stroke: '#c43a31' },
          parent: { border: '1px solid #ccc' },
        }}
        data={formattedData}
      />
    </VictoryChart>
  )
}
