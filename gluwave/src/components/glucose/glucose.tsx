'use client'

import { trpc } from '@/lib/trcp/client'

import { GraphContainer, GraphSkeleton, GraphTitle } from '../graph-container'
import { useNow } from '../use-now'
import { GlucoseGraphContent } from './glucose-graph-content'

interface Props {
  start: Date
  end: Date
}

export const Glucose = ({ start, end }: Props) => {
  const now = useNow()
  const g = trpc.glucose.get.useQuery({ start, end })

  if (g.isPending) {
    return <GraphSkeleton />
  }

  if (g.isLoadingError) {
    return 'Error'
  }

  const glucose = g.data

  const lastBloodGlucose = glucose[glucose.length - 1]

  // TODO
  const eventually = NaN.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })

  return (
    <GraphContainer>
      <GraphTitle href="/glucose/list">
        <div>
          <h2 className="font-semibold">Blood glucose</h2>
          <span className="text-xs text-slate-600">
            Eventually {eventually ? eventually : 'N/A'} mmol/l
          </span>
        </div>
      </GraphTitle>
      <GlucoseGraphContent now={now} glucose={glucose} />
    </GraphContainer>
  )
}
