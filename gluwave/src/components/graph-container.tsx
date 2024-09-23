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

import { victoryTheme } from './victory-theme'

interface Props {
  children: React.ReactNode
  className?: string
}

interface TitleProps extends Props {
  href: string
  chevron?: boolean
}

export const GraphContainer = ({ className, children }: Props) => {
  return (
    <div className={cn('border rounded-lg shadow bg-white', className)}>
      {children}
    </div>
  )
}

export const GraphTitle = ({
  href: href = '/',
  className,
  chevron: chevron = true,
  children,
}: TitleProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'p-2 px-4 border-b flex justify-between items-center hover:bg-slate-50 transition-colors',
        className
      )}
    >
      {children}
      {chevron && <ChevronRight className="h-4 w-4" />}
    </Link>
  )
}

interface ContentProps extends Props {
  domain: {
    x: DomainTuple
    y: DomainTuple
  }
  now: Date
  height?: number
}

export const GraphContent = ({
  className,
  children,
  domain,
  now,
  height: height = 200,
}: ContentProps) => {
  const initialZoomDomain = {
    x: [addHours(now, -2), addHours(now, 2)] as DomainTuple,
  }
  const [zoomDomain, onZoomDomainChange] = useState(initialZoomDomain)

  const [ticks, formatter] = useMemo(() => {
    var timeScaledomain = d3.scaleTime().domain(zoomDomain.x)
    const ticks = timeScaledomain.ticks(5)
    const formatter = timeScaledomain.tickFormat()

    return [ticks, formatter]
  }, [zoomDomain])

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
