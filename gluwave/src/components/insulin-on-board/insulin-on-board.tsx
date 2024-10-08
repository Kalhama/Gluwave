'use client'

import { trpc } from '@/lib/trcp/client'
import { addMinutes } from 'date-fns'
import { DomainTuple, VictoryArea, VictoryLine } from 'victory'

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
}

export const InsulinOnBoard = ({ start, end }: Props) => {
  const now = useNow()
  const i = trpc.insulin.getInsulinOnBoard.useQuery({ start, end })

  if (i.isPending) {
    return <GraphSkeleton />
  }

  if (i.isLoadingError) {
    return 'Error'
  }

  const parsed = i.data

  const domain = {
    y: [
      0,
      Math.max(5.5, ...parsed.map((insulin) => insulin.iob)) + 2,
    ] as DomainTuple,
    x: [
      new Date(Math.min(...parsed.map((d) => d.timestamp.getTime()))),
      new Date(Math.max(...parsed.map((d) => d.timestamp.getTime()))),
    ] as DomainTuple,
  }

  const current = parsed.find(
    (insulin) =>
      new Date(insulin.timestamp) > now &&
      new Date(insulin.timestamp) <= addMinutes(now, 1)
  )

  return (
    <GraphContainer>
      <GraphTitle href="/insulin/list">
        <div>
          <h2 className="font-semibold">Insulin on board</h2>

          <span className="text-xs text-slate-700">
            {(current?.iob ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 1,
            })}{' '}
            U
          </span>
        </div>
      </GraphTitle>

      <GraphContent domain={domain} now={now} height={150}>
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
        <VictoryArea
          style={{
            /* tailwind red-700 */
            data: { fill: '#b91c1c33', stroke: '#b91c1c', strokeWidth: 2 },
            parent: { border: '1px solid #ccc', padding: 0 },
          }}
          data={parsed}
          x="timestamp"
          y="iob"
        />
      </GraphContent>
    </GraphContainer>
  )
}
