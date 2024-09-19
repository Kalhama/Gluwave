'use client'

import { useEffect, useState } from 'react'

interface Props {
  minutes: number
}

export const AutoReload = ({ minutes }: Props) => {
  const [lastRefresh, setLastRefresh] = useState(new Date().getTime())
  useEffect(() => {
    const id = setInterval(async () => {
      const now = new Date().getTime()
      if (now - lastRefresh > minutes * 1000 * 60) {
        setLastRefresh(now)
        window.location.reload()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [minutes, lastRefresh])

  return null
}
