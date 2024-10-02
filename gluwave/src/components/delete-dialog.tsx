'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useServerAction } from '@/lib/use-server-action'
import { ServerActionResult } from '@/lib/wrap-server-action'
import { Loader2, Trash2 } from 'lucide-react'

import { Button } from './ui/button'

interface Props {
  id: number
  action: (...args: any[]) => Promise<ServerActionResult<void>>
}

export const DeleteDialog = ({ id, action: serverAction }: Props) => {
  const { action, loading } = useServerAction(serverAction)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="p-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : (
            <Trash2 className="cursor-pointer w-4 h-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => action({ id })}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
