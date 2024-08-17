'use client'

import { getData, getData2 } from '@/lib/sql_utils'
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
  predictionData2: PredictionData2
}

type PredictionData = Awaited<ReturnType<typeof getData>>
type PredictionData2 = Awaited<ReturnType<typeof getData2>>

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type PredictionDataElement = ArrayElement<PredictionData>
type PredictionDataElement2 = ArrayElement<PredictionData2>

// function sum(arr) {
//   return arr.reduce((acc, curr) => acc + curr, 0)
// }

export const BloodGlucose = ({ bloodGlucoseData, predictionData2 }: Props) => {
  const now = new Date()

  const lastBloodGlucose =
    bloodGlucoseData[bloodGlucoseData.length - 1]?.value ?? 0

  const yDomain = [
    2,
    Math.max(12, ...bloodGlucoseData.map((bg) => bg.value)),
  ] as DomainTuple

  const eventually =
    lastBloodGlucose -
    predictionData2[0].totalEffect +
    predictionData2[predictionData2.length - 1].totalEffect

  return (
    <div className="space-y-4">
      <div className="border rounded-sm">
        <div className="flex flex-row justify-between items-center pt-4 px-4">
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
            padding={{ top: 15, bottom: 30, left: 30, right: 15 }}
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
            <VictoryScatter
              style={{
                data: { stroke: '#c43a31' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              data={bloodGlucoseData}
              x="timestamp"
              y="value"
            />
            <VictoryLine
              style={{
                data: { stroke: '#c43a31', strokeDasharray: '2 2' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              data={predictionData2}
              x="timestamp"
              y={(d: PredictionDataElement2) =>
                d.cumulativeInsulinEffect -
                predictionData2[0].cumulativeInsulinEffect +
                lastBloodGlucose
              }
            />
            <VictoryLine
              style={{
                data: { stroke: '#7a7a7a', strokeDasharray: '2 2' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              data={predictionData2}
              x="timestamp"
              y={(d: PredictionDataElement2) =>
                d.totalEffect -
                predictionData2[0].totalEffect +
                lastBloodGlucose
              }
            />
            <VictoryLine
              style={{
                data: { stroke: '#31c449', strokeDasharray: '2 2' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              data={predictionData2}
              x="timestamp"
              y={(d: PredictionDataElement2) =>
                d.cumulativeCarbsEffect -
                predictionData2[0].cumulativeCarbsEffect +
                lastBloodGlucose
              }
            />
          </VictoryChart>
        </div>
      </div>
    </div>
  )
}
