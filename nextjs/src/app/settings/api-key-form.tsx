'use client'

import { deleteApiKey } from '@/actions/deleteApiKey'
import { newApiKey } from '@/actions/newApiKey'
import { ButtonLoading } from '@/components/button-loading'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/lib/use-server-action'
import * as React from 'react'

export const ApiKeyForm = ({ current }: { current: string | null }) => {
  const { action: newAction, loading: newLoading } = useServerAction(newApiKey)
  const { action: deleteAction, loading: deleteLoading } =
    useServerAction(deleteApiKey)

  return (
    <Card>
      <CardHeader>
        <CardTitle>API key management</CardTitle>
        <CardDescription>Delete or renew a API key</CardDescription>
      </CardHeader>
      <CardContent>
        <Input value={current ?? ''} />
      </CardContent>
      <CardFooter className="flex gap-2">
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
        </ButtonLoading>{' '}
      </CardFooter>
    </Card>
  )
}
