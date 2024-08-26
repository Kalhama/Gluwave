'use client'

import { Suspense, useEffect, useState } from 'react'

type ClientOnlyProps = { children: JSX.Element }

function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

export default function ClientOnly(props: ClientOnlyProps) {
  const hydrated = useHydration()
  return (
    <Suspense key={hydrated ? 'local' : 'utc'}>
      <>{props.children}</>
    </Suspense>
  )
}
