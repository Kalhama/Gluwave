import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  className?: string
}

export const GraphContainer = ({ className, children }: Props) => {
  return (
    <div className={cn('border rounded shadow', className)}>{children}</div>
  )
}

export const GraphTitle = ({ className, children }: Props) => {
  return <div className={cn('p-2 px-4 border-b', className)}>{children}</div>
}

export const GraphContent = ({ className, children }: Props) => {
  return <div className={cn('p-2', className)}>{children}</div>
}
