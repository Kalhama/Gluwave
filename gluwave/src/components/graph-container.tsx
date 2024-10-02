'use client'

import { cn } from '@/lib/utils'
import * as d3 from 'd3'
import { addHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  DomainTuple,
  VictoryAxis,
  VictoryChart,
  VictoryClipContainer,
  VictoryZoomContainer,
} from 'victory'

import { Skeleton } from './ui/skeleton'
import { useClient } from './use-client'
import { victoryTheme } from './victory-theme'

interface Props {
  children: React.ReactNode
  className?: string
}

interface TitleProps extends Props {
  href?: string
}

export const GraphContainer = ({ className, children }: Props) => {
  return (
    <div className={cn('border rounded-lg shadow bg-white', className)}>
      {children}
    </div>
  )
}

export const GraphTitle = ({ href, className, children }: TitleProps) => {
  const Comp = href ? Link : 'div'

  return (
    <Comp
      href={href ?? ''}
      className={cn(
        'p-2 px-4 border-b flex justify-between items-center ',
        href ? 'hover:bg-slate-50 transition-colors' : '',
        className
      )}
    >
      {children}
      {href && <ChevronRight className="h-4 w-4" />}
    </Comp>
  )
}

interface ContentProps extends Props {
  domain: {
    x: DomainTuple
    y: DomainTuple
  }
  now: Date
  height?: number
  initialZoomDomain?: {
    x: DomainTuple
  }
}

export const GraphContent = ({
  className,
  children,
  domain,
  now,
  height: height = 200,
  initialZoomDomain,
}: ContentProps) => {
  if (!initialZoomDomain) {
    initialZoomDomain = {
      x: [addHours(now, -2), addHours(now, 2)] as DomainTuple,
    }
  }

  const [zoomDomain, onZoomDomainChange] = useState(initialZoomDomain)

  const [ticks, formatter] = useMemo(() => {
    var timeScaledomain = d3.scaleTime().domain(zoomDomain.x)
    const ticks = timeScaledomain.ticks(5)
    const formatter = timeScaledomain.tickFormat()

    return [ticks, formatter]
  }, [zoomDomain])

  const isClient = useClient()

  if (!isClient)
    return (
      <div className={cn('p-4')}>
        <Skeleton className={cn('w-full h-[250px] rounded-xl')} />
      </div>
    )

  return (
    <div className={cn('p-2', className)}>
      <VictoryChart
        padding={padding}
        height={height}
        domain={{
          y: domain.y,
        }}
        containerComponent={
          <VictoryZoomContainer
            clipContainerComponent={<VictoryClipContainer clipId={1} />}
            allowZoom={false}
            /* zoomDomain is actually just a initial zoom domain. If we pass zoomDomain on every change, whole chart rerenders causing performance issues */
            zoomDomain={initialZoomDomain}
            onZoomDomainChange={onZoomDomainChange}
          />
        }
        theme={victoryTheme}
      >
        <VictoryAxis
          tickValues={ticks}
          tickFormat={formatter}
          offsetY={padding.bottom}
        />
        <VictoryAxis
          crossAxis={false}
          tickFormat={(v) => Math.round(v)}
          dependentAxis
        />
        {children}
      </VictoryChart>
    </div>
  )
}

export const padding = { top: 10, bottom: 25, left: 27, right: 15 }

export const GraphSkeleton = () => {
  return (
    <div className={cn('border rounded-lg shadow bg-white')}>
      <GraphTitle>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </GraphTitle>
      <div className={cn('p-4')}>
        <Skeleton className={cn('w-full h-[250px] rounded-xl')} />
      </div>
    </div>
  )
}
