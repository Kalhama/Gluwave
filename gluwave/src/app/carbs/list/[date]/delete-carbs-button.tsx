'use client'

import { deleteCarbs } from '@/actions/delete-carbs'
import { useServerAction } from '@/lib/use-server-action'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  id: number
}

export const DeleteCarbButton = ({ id }: Props) => {
  const { action, loading } = useServerAction(deleteCarbs)

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  return (
    <Trash2 onClick={() => action({ id })} className="cursor-pointer w-4 h-4" />
  )
}
