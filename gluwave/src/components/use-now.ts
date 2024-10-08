import { useEffect, useState } from 'react'

export const useNow = (refreshSeconds = 5) => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    setTimeout(() => {
      setNow(new Date())
    }, refreshSeconds * 1000)
  }, [refreshSeconds])

  return now
}
