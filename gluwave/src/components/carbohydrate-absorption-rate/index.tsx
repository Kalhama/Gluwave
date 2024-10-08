'use client'

import { trpc } from '@/lib/trcp/client'
import { Tuple } from 'victory'

import { GraphContainer, GraphSkeleton, GraphTitle } from '../graph-container'
import { CarbohydrateAbsorptionRateGraph } from './carbohydrate-absorption-rate-graph'

interface Props {
  href?: string
  start: Date
  end: Date
}

export default function CarbohydrateAbsorptionRate({
  href,
  start,
  end,
}: Props) {
  const now = new Date()

  const r = trpc.carbohydrate.getReportedRate.useQuery({
    start,
    end,
  })
  const o = trpc.analysis.getCarbohydratesRateObserved.useQuery({
    start,
    end,
  })

  if (r.isPending || o.isPending) {
    return <GraphSkeleton />
  }

  if (r.isLoadingError || o.isLoadingError) {
    return 'Error'
  }

  const observedRate = o.data.map((o) => {
    return {
      x: o.timestamp,
      y: (o.observedCarbs / (o.interval ?? 1)) * (15 * 60),
    }
  })

  const reportedRate = r.data.map((o) => {
    return {
      x: o.timestamp,
      y: o.rate * 15, // bring to same scale with observed
    }
  })

  const domain = {
    y: [
      Math.min(
        ...observedRate.map((c) => c.y),
        ...reportedRate.map((c) => c.y)
      ) - 1,
      Math.max(
        ...observedRate.map((c) => c.y),
        ...reportedRate.map((c) => c.y)
      ) + 1,
    ] as Tuple<number>,
    x: [start, end] as Tuple<Date>,
  }

  return (
    <GraphContainer>
      <GraphTitle href={href} className="flex justify-between">
        <div>
          <h2 className="font-semibold">Carbohydrate absorption rate</h2>
          <span className="text-xs text-slate-600">~15 min period</span>
        </div>
      </GraphTitle>
      <CarbohydrateAbsorptionRateGraph
        now={now}
        observed={observedRate}
        reported={reportedRate}
        domain={domain}
      />
    </GraphContainer>
  )
}
