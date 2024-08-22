'use client'

import { updateSettings } from '@/actions/update-settings'
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
            name="carbohydrateRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbohydrate ratio (g/U)</FormLabel>
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
          <FormField
            control={form.control}
            name="correctionRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Correction ratio for high blood glucose (mmol/l / U)
                </FormLabel>
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
          <FormItem>
            <FormLabel>
              Carbs to glucose increase ratio based on above (g / mmol/l).
              (Based on above ICR and ISF)
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={(
                  form.watch('carbohydrateRatio') /
                  form.watch('correctionRatio')
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })}
                disabled
              />
            </FormControl>
            <FormDescription />
            <FormMessage />
          </FormItem>
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target blood glucose (mmol/l)</FormLabel>
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
