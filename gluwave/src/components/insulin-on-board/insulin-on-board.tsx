'use client'

import { calculateUserInsulinData } from '@/lib/sql_utils'
import { addHours, addMinutes, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

type InsulinData = Awaited<ReturnType<typeof calculateUserInsulinData>>
type InsulinDataItem = InsulinData[0]

interface Props {
  data: InsulinData
}

export const InsulinOnBoard = ({ data }: Props) => {
  const now = new Date()

  const yDomain = [
    0,
    Math.max(5, ...data.map((insulin) => insulin.insulinOnBoard)) + 2,
  ] as DomainTuple

  const current = data.find(
    (insulin) =>
      insulin.timestamp > now && insulin.timestamp <= addMinutes(now, 1)
  )

  return (
    <div>
      <div className="flex flex-row justify-between items-center pt-2 px-4">
        <h2 className="font-semibold">Insulin on board</h2>
        <Link href="/insulin/list">
          <div className="flex items-center">
            <span className="mt-0 text-sm">
              {(current?.insulinOnBoard ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 1,
              })}{' '}
              U
            </span>
            <ChevronRight />
          </div>
        </Link>
      </div>
      <div className="p-2">
        <VictoryChart
          padding={{ top: 10, bottom: 25, left: 30, right: 15 }}
          height={130}
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
          <VictoryLine
            style={{
              data: { stroke: '#c43a31' },
              parent: { border: '1px solid #ccc', padding: 0 },
            }}
            data={data}
            x="timestamp"
            y="insulinOnBoard"
          />
        </VictoryChart>
      </div>
    </div>
  )
}
