'use client'

import { trpc } from '@/lib/trcp/client'
import { addHours, differenceInMinutes, subMinutes } from 'date-fns'
import { DomainTuple, Tuple, VictoryArea, VictoryLine } from 'victory'

import {
  GraphContainer,
  GraphContent,
  GraphSkeleton,
  GraphTitle,
} from '../graph-container'
import { useNow } from '../use-now'

interface Props {
  start: Date
  end: Date
  href: string
}

export const CarbohydratesOnBoard = ({ start, end, href }: Props) => {
  const now = useNow()

  const o = trpc.analysis.getCarbohydratesOnBoardObserved.useQuery({
    start,
    end,
  })
  const p = trpc.analysis.getCarbohydratesOnBoardPredicted.useQuery({
    start,
    end,
  })

  if (o.isPending || p.isPending) {
    return <GraphSkeleton />
  }

  if (o.isLoadingError || p.isLoadingError) {
    return 'Error'
  }

  const predicted = p.data

  const observed = o.data

  const initialZoomDomain = {
    x: [addHours(now, -3), addHours(now, 3)] as Tuple<Date>,
  }

  const union = [
    { timestamp: subMinutes(observed[0]?.timestamp ?? now, 1), cob: 0 }, // start from 0 for nicer plot
    ...observed,
    ...predicted,
  ]

  // latest past value
  const current =
    union
      .filter((u) => differenceInMinutes(u.timestamp, now) < 0)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .find((u) => u)?.cob ?? 0

  const domain = {
    y: [
      Math.min(1, ...union.map((d) => d.cob)) - 1,
      Math.max(10, ...union.map((d) => d.cob)) + 2,
    ] as DomainTuple,
    x: [
      new Date(Math.min(...union.map((d) => d.timestamp.getTime()))),
      new Date(Math.max(...union.map((d) => d.timestamp.getTime()))),
    ] as DomainTuple,
  }

  return (
    <GraphContainer>
      <GraphTitle href={href} className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrates on board</h2>
          <span className="text-xs">
            Current{' '}
            {current.toLocaleString([], {
              maximumFractionDigits: 0,
            })}{' '}
            g
          </span>
        </div>
      </GraphTitle>

      <GraphContent
        initialZoomDomain={initialZoomDomain}
        domain={domain}
        now={now}
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
            { x: now, y: -5000 },
            { x: now, y: 5000 },
          ]}
        />
        <VictoryArea
          style={{
            /* tailwind green-700 */
            data: { fill: '#15803d88' },
          }}
          interpolation="linear"
          data={union}
          x="timestamp"
          y="cob"
        />
      </GraphContent>
    </GraphContainer>
  )
}
