'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { parseCommaFloat } from '@/lib/parse-comma-float'
import { trpc } from '@/lib/trcp/client'
import { ZPostProfileSchema } from '@/server/routes/post-profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  defaultValues: z.infer<typeof ZPostProfileSchema>
}

export function SettingsForm({ defaultValues }: Props) {
  const form = useForm<z.infer<typeof ZPostProfileSchema>>({
    resolver: zodResolver(ZPostProfileSchema),
    defaultValues,
  })

  const post = trpc.user.postProfile.useMutation()
  const utils = trpc.useUtils()

  async function onSubmit(values: z.infer<typeof ZPostProfileSchema>) {
    post.mutate(values, {
      onSuccess() {
        utils.user.invalidate()
        utils.analysis.invalidate()
        form.reset(values)
      },
    })
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="carbohydrateRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbohydrate ratio</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription>g / U</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="correctionRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correction ratio for high blood glucose</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription>mmol/l / U</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Carbs to glucose ratio</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={(
                  parseCommaFloat(form.watch('carbohydrateRatio')) /
                  parseCommaFloat(form.watch('correctionRatio'))
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })}
                disabled
              />
            </FormControl>
            <FormDescription>
              <div>g / mmol/l</div>
              <div>Based on above ICR and ISF</div>
            </FormDescription>
            <FormMessage />
          </FormItem>
          <FormField
            control={form.control}
            name="insulinOnBoardOffset"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Offset for insulin on board target (U)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            onClick={() => form.reset()}
            type="button"
            variant="secondary"
            className="mr-2"
          >
            Cancel
          </Button>
          <Button disabled={post.isPending} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}
