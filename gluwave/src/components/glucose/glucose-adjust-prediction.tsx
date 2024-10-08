'use client'

import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trcp/client'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { GraphContainer, GraphSkeleton, GraphTitle } from '../graph-container'
import { buttonVariants } from '../ui/button'
import { Separator } from '../ui/separator'
import { useNow } from '../use-now'
import { GlucoseGraphContent } from './glucose-graph-content'

interface Props {
  start: Date
  end: Date
}

export const GlucoseAdjustPrediction = ({ start, end }: Props) => {
  const now = useNow()

  const [includeCarbs, setIncludeCarbs] = useState(true)
  const [includeInsulin, setIncludeInsulin] = useState(true)

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

  const lastBloodGlucose = glucose[glucose.length - 1]?.value ?? 7

  const displayed = (() => {
    if (!includeCarbs && !includeInsulin) return 'none'
    else if (!includeCarbs) return 'insulin_prediction'
    else if (!includeInsulin) return 'carbohydrate_prediction'
    else return 'prediction'
  })()

  const displayedPrediction = prediction.map((p) => {
    return {
      x: p.timestamp,
      y:
        displayed === 'none'
          ? lastBloodGlucose
          : lastBloodGlucose + p[displayed],
    }
  })
  const eventually = displayedPrediction
    .slice(-1)[0]
    ?.y?.toLocaleString(undefined, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    })

  return (
    <GraphContainer>
      <GraphTitle>
        <div>
          <h2 className="font-semibold">Blood glucose</h2>
          <span className="text-xs text-slate-600">
            Eventually {eventually ? eventually : 'N/A'} mmol/l
          </span>
        </div>
      </GraphTitle>
      <GlucoseGraphContent
        prediction={displayedPrediction}
        glucose={glucose}
        now={now}
      />
      <div className="p-6 space-y-6">
        <Separator />
        <div className="flex justify-between items-center gap-2">
          <div>
            <h2 className="font-bold">Include insulin</h2>
            <p className="text-sm">Include insulin in the prediction</p>
          </div>
          <Switch
            checked={includeInsulin}
            onCheckedChange={setIncludeInsulin}
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <div>
            <h2 className="font-bold">Include carbohydrates</h2>
            <p className="text-sm">Include carbohydrates in the prediction</p>
          </div>
          <Switch checked={includeCarbs} onCheckedChange={setIncludeCarbs} />
        </div>
        <Separator />
        <div className="text-right">
          <Link
            className={cn(buttonVariants({ variant: 'secondary' }))}
            href="/glucose/list"
          >
            View all glucose readings <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    </GraphContainer>
  )
}
