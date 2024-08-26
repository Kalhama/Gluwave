'use client'

interface Props {
  timestamp: Date
}

export const ClientDateTime = ({ timestamp }: Props) => {
  return (
    <span suppressHydrationWarning>
      {timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  )
}
