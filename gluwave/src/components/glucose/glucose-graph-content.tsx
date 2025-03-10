'use client'

import { addHours, subHours } from 'date-fns'
import { DomainTuple, VictoryLine, VictoryScatter } from 'victory'

import { GraphContent } from '../graph-container'

interface Props {
  glucose: {
    timestamp: Date
    value: number
  }[]

  now: Date
}

export const GlucoseGraphContent = ({ glucose, now }: Props) => {
  const domain = {
    y: [
      Math.min(1, ...glucose.map((bg) => bg.value)) - 1,
      Math.max(10, ...glucose.map((bg) => bg.value)) + 2,
    ] as DomainTuple,
    x: [
      new Date(Math.min(...glucose.map((d) => d.timestamp.getTime()))),
      new Date(Math.max(...glucose.map((d) => d.timestamp.getTime()))),
    ] as DomainTuple,
  }

  return (
    <>
      <GraphContent domain={domain} now={now}>
        {glucose.length !== 0 && (
          <VictoryScatter
            style={{
              data: { stroke: '#c43a31' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            size={2}
            data={glucose}
            x="timestamp"
            y="value"
          />
        )}
        <VictoryLine
          style={{
            data: {
              strokeDasharray: '2 2',
              strokeWidth: 1,
              stroke: '#c43a31',
            },
          }}
          data={[
            { x: now, y: -100 },
            { x: now, y: 100 },
          ]}
        />

        {/* empty chart in case there is no other data, so that x axis remains stable */}
        <VictoryLine
          data={[
            { x: subHours(now, 24), y: null },
            { x: addHours(now, 24), y: null },
          ]}
        />
      </GraphContent>
    </>
  )
}
