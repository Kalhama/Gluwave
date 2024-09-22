import { cn } from '@/lib/utils'
import { addHours, subHours } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  DomainTuple,
  VictoryChart,
  VictoryClipContainer,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory'

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
  yDomain: DomainTuple
  now: Date
  height?: number
}

export const GraphContent = ({
  className,
  children,
  yDomain,
  now,
  height: height = 200,
}: ContentProps) => {
  return (
    <div className={cn('p-2', className)}>
      <VictoryChart
        padding={padding}
        height={height}
        domain={{
          y: yDomain,
        }}
        containerComponent={
          <VictoryZoomContainer
            clipContainerComponent={<VictoryClipContainer clipId={1} />}
            allowZoom={false}
            zoomDomain={{
              x: [subHours(now, 6), addHours(now, 6)],
            }}
          />
        }
        theme={VictoryTheme.material}
      >
        {children}
      </VictoryChart>
    </div>
  )
}

export const padding = { top: 10, bottom: 25, left: 30, right: 15 }
