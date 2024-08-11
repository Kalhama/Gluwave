'use client'

import { deleteCarb } from '@/actions/deleteCarb'
import { deleteInsulin } from '@/actions/deleteInsulin'
import { useServerAction } from '@/lib/use-server-action'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  id: number
}

export const DeleteCarbButton = ({ id }: Props) => {
  const { action, loading } = useServerAction(deleteCarb)

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  return (
    <Trash2 onClick={() => action({ id })} className="cursor-pointer w-4 h-4" />
  )
}
