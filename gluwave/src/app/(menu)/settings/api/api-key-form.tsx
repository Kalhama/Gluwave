'use client'

import { ButtonLoading } from '@/components/button-loading'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/lib/trcp/client'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ZPostApiKeySchema = z.object({
  apikey: z.string().optional(),
})

export const ApiKeyForm = ({ defaultValue }: { defaultValue?: string }) => {
  const form = useForm<z.infer<typeof ZPostApiKeySchema>>({
    resolver: zodResolver(ZPostApiKeySchema),
    defaultValues: {
      apikey: defaultValue ?? '',
    },
  })

  const post = trpc.user.postApiKey.useMutation()
  const del = trpc.user.deleteApiKey.useMutation()

  const onSubmit = async () => {
    const res = await post.mutateAsync()
    form.reset({
      apikey: res,
    })
  }

  const onDelete = () => {
    form.reset({
      apikey: '',
    })
    del.mutate()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="apikey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API key</FormLabel>
              <FormControl>
                <Input
                  placeholder="No API key"
                  className="disabled:cursor-pointer"
                  disabled
                  {...field}
                />
              </FormControl>
              <FormDescription>
                With this API key anyone can get a full access to your Gluwave
                account. Do not share it to people you don&apos;t trust
              </FormDescription>
            </FormItem>
          )}
        />
        <div className="flex gap-2 mt-4">
          <ButtonLoading
            loading={del.isPending}
            onClick={onDelete}
            variant="outline"
            type="button"
          >
            Revoke
          </ButtonLoading>
          <ButtonLoading loading={post.isPending} type="submit">
            {form.watch('apikey') ? 'Refresh' : 'Create'}
          </ButtonLoading>
        </div>
      </form>
    </Form>
  )
}
