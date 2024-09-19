'use client'

import {
  DomainTuple,
  VictoryChart,
  VictoryScatter,
  VictoryTheme,
} from 'victory'

interface Props {
  data: {
    x: number | Date | string
    y: number
  }[]
}

export const Plot = ({ data }: Props) => {
  const yDomain = [
    Math.min(2, ...data.map((d) => d.y)) - 2,
    Math.max(12, ...data.map((d) => d.y)) + 2,
  ] as DomainTuple
  return (
    <VictoryChart
      padding={{ top: 10, bottom: 25, left: 30, right: 15 }}
      height={200}
      domain={{
        y: yDomain,
      }}
      theme={VictoryTheme.material}
    >
      <VictoryScatter data={data} />
    </VictoryChart>
  )
}
