'use client'

import { type Runner } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

interface Props {
  bloodGlucoseData: {
    timestamp: Date
    value: number
  }[]
  predictions: Predictions
}

type Predictions = Awaited<ReturnType<Runner['predict']>>

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type PredictionElement = ArrayElement<Predictions>

// function sum(arr) {
//   return arr.reduce((acc, curr) => acc + curr, 0)
// }

export const BloodGlucose = ({ bloodGlucoseData, predictions }: Props) => {
  const now = new Date()

  const lastBloodGlucose =
    bloodGlucoseData[bloodGlucoseData.length - 1]?.value ?? 0

  const yDomain = [
    0,
    Math.max(12, ...bloodGlucoseData.map((bg) => bg.value)) + 2,
  ] as DomainTuple

  const eventually =
    lastBloodGlucose -
    predictions[0]?.totalEffect +
    predictions[predictions.length - 1]?.totalEffect

  return (
    <div>
      <div className="flex flex-row justify-between items-center pt-2 px-4">
        <h2 className="font-semibold">Blood glucose</h2>
        <Link href="/glucose/list">
          <div className="flex items-center">
            <span className="mt-0 text-sm">
              Eventually{' '}
              {eventually.toLocaleString(undefined, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
              })}{' '}
              mmol/l
            </span>
            <ChevronRight />
          </div>
        </Link>
      </div>
      <div className="p-2">
        <VictoryChart
          padding={{ top: 10, bottom: 25, left: 30, right: 15 }}
          height={200}
          domain={{
            y: yDomain,
          }}
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
            y={(d: PredictionElement) =>
              d.insulinEffect - predictions[0].insulinEffect + lastBloodGlucose
            }
          />
          <VictoryLine
            style={{
              data: { stroke: '#7a7a7a', strokeDasharray: '2 2' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={predictions}
            x="timestamp"
            y={(d: PredictionElement) =>
              d.totalEffect - predictions[0].totalEffect + lastBloodGlucose
            }
          />
          <VictoryLine
            style={{
              data: { stroke: '#31c449', strokeDasharray: '2 2' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={predictions}
            x="timestamp"
            y={(d: PredictionElement) =>
              d.carbEffect - predictions[0].carbEffect + lastBloodGlucose
            }
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
      </div>
    </div>
  )
}
