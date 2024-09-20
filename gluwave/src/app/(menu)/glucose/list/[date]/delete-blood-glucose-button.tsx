'use client'

import { deleteGlucose } from '@/actions/delete-glucose'
import { useServerAction } from '@/lib/use-server-action'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  id: number
}

export const DeleteBloodGlucoseButton = ({ id }: Props) => {
  const { action, loading } = useServerAction(deleteGlucose)

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  return (
    <Trash2 onClick={() => action({ id })} className="cursor-pointer w-4 h-4" />
  )
}
