'use client'

import { Skeleton } from './ui/skeleton'
import { useClient } from './use-client'

interface Props {
  timestamp: Date
}

export const ClientDateTime = ({ timestamp }: Props) => {
  const client = useClient()

  if (!client) {
    return <Skeleton className="w-12 h-6 inline-block align-middle" />
  } else {
    return (
      <span>
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    )
  }
}
