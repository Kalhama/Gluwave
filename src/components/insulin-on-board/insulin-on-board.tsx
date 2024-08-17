'use client'

import { calculateUserInsulinData } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

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
  const now = new Date()

  const yDomain = [
    Math.min(0, ...formattedData.map((insulin) => insulin.y)) - 2,
    Math.max(5, ...formattedData.map((insulin) => insulin.y)) + 2,
  ] as DomainTuple

  return (
    <div className="space-y-4">
      <div className="border rounded-sm">
        <div className="flex flex-row justify-between items-center pt-4 px-4">
          <h2 className="font-semibold">Insulin on board</h2>
          <Link href="/insulin/list">
            <div className="flex items-center">
              <span className="mt-0 text-sm">TODO U</span>
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
                { x: now, y: 10 },
              ]}
            />
            <VictoryLine
              style={{
                data: { stroke: '#c43a31' },
                parent: { border: '1px solid #ccc', padding: 0 },
              }}
              data={formattedData}
            />
          </VictoryChart>
        </div>
      </div>
    </div>
  )
}
