'use client'

import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trcp/client'
import { Loader2, PlusIcon, Trash, Trash2 } from 'lucide-react'

const ApiKeyList = () => {
  const utils = trpc.useUtils()
  const post = trpc.apikey.post.useMutation({
    onSuccess: () => utils.apikey.get.invalidate(),
  })
  const getAll = trpc.apikey.get.useQuery()
  const del = trpc.apikey.delete.useMutation({
    onSuccess: () => utils.apikey.get.invalidate(),
  })

  return (
    <div className="mt-4">
      <div className="space-y-4">
        {getAll.data?.map((el) => (
          <div
            key={el.key}
            className="p-4 bg-slate-100 rounded-md w-full flex justify-between items-center"
          >
            {el.key}
            <Button onClick={() => del.mutate({ key: el.key })} variant="ghost">
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Button
          className="mt-4"
          disabled={post.isPending || getAll.isPending}
          onClick={() => post.mutate()}
        >
          {post.isPending || getAll.isPending ? (
            <Loader2 className="size-4 mr-2" />
          ) : (
            <PlusIcon className="size-4 mr-2" />
          )}
          Luo uusi
        </Button>
      </div>
    </div>
  )
}
export default ApiKeyList
