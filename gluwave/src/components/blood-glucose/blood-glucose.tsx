'use client'

import { addHours, subHours } from 'date-fns'
import {
  DomainTuple,
  VictoryChart,
  VictoryClipContainer,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

import { GraphContainer, GraphContent, GraphTitle } from '../graph-container'

interface Props {
  bloodGlucoseData: {
    timestamp: Date
    value: number
  }[]
  predictions: Prediction[]
  now: Date
}

type Prediction = {
  timestamp: Date
  carbEffect: number
  insulinEffect: number
  totalEffect: number
}

export const BloodGlucose = ({ bloodGlucoseData, predictions, now }: Props) => {
  const lastBloodGlucose =
    bloodGlucoseData[bloodGlucoseData.length - 1]?.value ?? 0

  const yDomain = [
    Math.min(3, ...bloodGlucoseData.map((bg) => bg.value)) - 1,
    Math.max(10, ...bloodGlucoseData.map((bg) => bg.value)) + 2,
  ] as DomainTuple

  const eventually =
    lastBloodGlucose -
    predictions[0]?.totalEffect +
    predictions[predictions.length - 1]?.totalEffect

  return (
    <GraphContainer>
      <GraphTitle href="/glucose/list">
        <div>
          <h2 className="font-semibold">Blood glucose</h2>
          <span className="text-xs text-slate-600">
            Eventually{' '}
            {eventually.toLocaleString(undefined, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            })}{' '}
            mmol/l
          </span>
        </div>
      </GraphTitle>
      <GraphContent>
        <VictoryChart
          padding={{ top: 10, bottom: 25, left: 30, right: 15 }}
          height={200}
          domain={{
            y: yDomain,
          }}
          containerComponent={
            <VictoryZoomContainer
              clipContainerComponent={<VictoryClipContainer clipId={1} />}
              allowZoom={false}
              zoomDomain={{
                x: [subHours(now, 2), addHours(now, 2)],
              }}
            />
          }
          theme={VictoryTheme.material}
        >
          {/* empty chart in case there is no other data, so that x axis remains stable */}
          <VictoryLine
            data={[
              { x: subHours(now, 24), y: null },
              { x: addHours(now, 24), y: null },
            ]}
          />
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
              data: { stroke: '#c43a31', strokeDasharray: '2 2' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={predictions}
            x="timestamp"
            y={(d: Prediction) => d.insulinEffect + lastBloodGlucose}
          />
          <VictoryLine
            style={{
              data: { stroke: '#7a7a7a', strokeDasharray: '2 2' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={predictions}
            x="timestamp"
            y={(d: Prediction) => d.totalEffect + lastBloodGlucose}
          />
          <VictoryLine
            style={{
              data: { stroke: '#31c449', strokeDasharray: '2 2' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={predictions}
            x="timestamp"
            y={(d: Prediction) => d.carbEffect + lastBloodGlucose}
          />
          <VictoryScatter
            style={{
              data: { stroke: '#c43a31' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            size={2}
            data={bloodGlucoseData}
            x="timestamp"
            y="value"
          />
        </VictoryChart>
      </GraphContent>
    </GraphContainer>
  )
}
