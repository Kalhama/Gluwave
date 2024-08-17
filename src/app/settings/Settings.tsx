'use client'

import { updateSettings } from '@/actions/updateSettings'
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
import { useServerAction } from '@/lib/use-server-action'
import { updateSettingsSchema } from '@/schemas/updateSettingsSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  defaultValues: z.infer<typeof updateSettingsSchema>
}

export function Settings({ defaultValues }: Props) {
  const { action, loading } = useServerAction(updateSettings)

  const form = useForm<z.infer<typeof updateSettingsSchema>>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues,
  })

  async function onSubmit(values: z.infer<typeof updateSettingsSchema>) {
    action(values)
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 border rounded-sm p-4"
        >
          <h1 className="text-xl font-bold">Update your personal settings</h1>
          <FormField
            control={form.control}
            name="carbsPerUnits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbs per units (g/U)</FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adjustmentRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Adjustment rate for high blood glucose (mmol/l / U)
                </FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target blood glucose (mmol/l)</FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    onChange={(val) => field.onChange(val.target.value)}
                  />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="insulinOnBoardOffset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offset for insulin on board target (U)</FormLabel>
                <FormControl>
                  <Input
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
          <Button disabled={loading} type="submit">
            Submit
          </Button>
        </form>
      </Form>
      <div className="space-y-4 border rounded-sm p-4">
        <h1 className="text-xl font-bold">Logout</h1>
        <Button>
          <a href="/logout">Logout</a>
        </Button>
      </div>
    </div>
  )
}
