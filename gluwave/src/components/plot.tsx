'use client'

import { InterpolationPropType, VictoryChart, VictoryLine } from 'victory'

interface Props {
  data: {
    x: any
    y: any
  }[]
  interpolation?: InterpolationPropType
}

export const Plot = ({
  data,
  interpolation: interpolation = 'linear',
}: Props) => {
  return (
    <div className="bg-white">
      <VictoryChart>
        <VictoryLine interpolation={interpolation} data={data} />
      </VictoryChart>
    </div>
  )
}
