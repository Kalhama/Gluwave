'use client'

import { addHours, subHours } from 'date-fns'
import { timestamp } from 'drizzle-orm/pg-core'
import { DomainTuple, VictoryLine, VictoryScatter } from 'victory'

import { GraphContent, GraphTitle } from '../graph-container'

interface Props {
  glucose: {
    timestamp: Date
    value: number
  }[]
  prediction: {
    x: Date
    y: number
  }[]
  now: Date
}

export const GlucoseChartContent = ({ glucose, prediction, now }: Props) => {
  const domain = {
    y: [
      Math.min(
        1,
        ...glucose.map((bg) => bg.value),
        ...prediction.map((p) => p.y)
      ) - 1,
      Math.max(
        10,
        ...glucose.map((bg) => bg.value),
        ...prediction.map((p) => p.y)
      ) + 2,
    ] as DomainTuple,
    x: [
      new Date(
        Math.min(
          ...glucose.map((d) => d.timestamp.getTime()),
          ...prediction.map((d) => d.x.getTime())
        )
      ),
      new Date(
        Math.max(
          ...glucose.map((d) => d.timestamp.getTime()),
          ...prediction.map((d) => d.x.getTime())
        )
      ),
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
            data={glucose.map((g) => {
              return {
                timestamp: g.timestamp,
                value: g.value - 5,
              }
            })}
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
        <VictoryLine
          style={{
            /* tailwind sky-600 */
            data: {
              stroke: '#0284c7aa',
              strokeDasharray: '3 3',
              strokeWidth: 3,
            },
            parent: { border: '1px solid #ccc', padding: 0 },
          }}
          data={prediction.map((p) => {
            return {
              x: p.x,
              y: p.y - 5,
            }
          })}
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
