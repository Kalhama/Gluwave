import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

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

export const GraphContent = ({ className, children }: Props) => {
  return <div className={cn('p-2', className)}>{children}</div>
}
