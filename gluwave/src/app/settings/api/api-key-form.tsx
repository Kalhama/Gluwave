'use client'

import { deleteApiKey } from '@/actions/delete-api-key'
import { newApiKey } from '@/actions/new-api-key'
import { ButtonLoading } from '@/components/button-loading'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/lib/use-server-action'
import * as React from 'react'

export const ApiKeyForm = ({ current }: { current: string | null }) => {
  const { action: newAction, loading: newLoading } = useServerAction(newApiKey)
  const { action: deleteAction, loading: deleteLoading } =
    useServerAction(deleteApiKey)

  return (
    <div className="space-y-4">
      <Input placeholder="No key" value={current ?? ''} />

      <div className="flex gap-2">
        <ButtonLoading
          loading={newLoading}
          onClick={async () => {
            await newAction()
            window.location.reload()
          }}
        >
          Refresh
        </ButtonLoading>
        <ButtonLoading
          variant="destructive"
          loading={deleteLoading}
          onClick={async () => {
            await deleteAction()
            window.location.reload()
          }}
        >
          Delete
        </ButtonLoading>
      </div>
    </div>
  )
}
