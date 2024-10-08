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
  const p = trpc.analysis.getGlucosePrediction.useQuery({ start, end })

  if (g.isPending || p.isPending) {
    return <GraphSkeleton />
  }

  if (g.isLoadingError || p.isLoadingError) {
    return 'Error'
  }

  const prediction = p.data

  const glucose = g.data

  const lastBloodGlucose = glucose[glucose.length - 1]

  const displayedPrediction = prediction.map((p) => {
    return {
      x: p.timestamp,
      y: p.prediction + (lastBloodGlucose?.value ?? 7),
    }
  })

  const eventually = displayedPrediction[
    displayedPrediction.length - 1
  ]?.y.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })

  return (
    <GraphContainer>
      <GraphTitle href="/glucose/predictions">
        <div>
          <h2 className="font-semibold">Blood glucose</h2>
          <span className="text-xs text-slate-600">
            Eventually {eventually ? eventually : 'N/A'} mmol/l
          </span>
        </div>
      </GraphTitle>
      <GlucoseGraphContent
        now={now}
        glucose={glucose}
        prediction={displayedPrediction}
      />
    </GraphContainer>
  )
}
