'use client'

import { useState } from 'react'

import { ServerActionResult } from './wrap-server-action'

// In client you should be able to use this hook like const {action, status, data, error} = useServerAction(action) where action is the wrapped server action from wrapServerAction
export const useServerAction = <T>(
  action: (...args: any[]) => Promise<ServerActionResult<T>>
) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string>()

  const actionHandler = async (...args: Parameters<typeof action>) => {
    setLoading(true)
    const ret = await action(...args)
    setLoading(false)
    if (ret.success) {
      setData(ret.data)
    } else {
      setError(ret.error)
    }

    setLoading(false)

    return ret
  }

  return {
    action: actionHandler,
    loading,
    data,
    message: error,
  }
}
