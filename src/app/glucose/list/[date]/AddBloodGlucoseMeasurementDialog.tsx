'use client'

import { addGlucosenAction } from '@/actions/addGlucose'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useServerAction } from '@/lib/use-server-action'
import { addGlucoseSchema } from '@/schemas/addGlucoseSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleFadingPlus } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export function AddBloodGlucoseMeasurementDialog() {
  const { action, loading, data, message } = useServerAction(addGlucosenAction)
  const form = useForm<z.infer<typeof addGlucoseSchema>>({
    resolver: zodResolver(addGlucoseSchema),
    defaultValues: {
      value: 7,
      timedelta: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof addGlucoseSchema>) {
    console.log(values)
    await action(values)
    form.reset()
    setOpenChange(false)
  }

  const [open, setOpenChange] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        form.reset()
        setOpenChange(s)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <CircleFadingPlus className="h-4 w-4 mr-2" /> Add glucose measurement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add glucose measurement manually</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="timedelta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(Number(val))
                      }}
                      defaultValue={String(field.value)}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue id="time" placeholder="Now" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={'0'}>Now</SelectItem>
                          {Array.from({ length: 36 }).map((_, i) => {
                            return (
                              <SelectItem value={String(-i * 5 - 5)} key={i}>
                                -{i * 5 + 5} min
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type="text"
                      className="col-span-3"
                      value={field.value}
                      onChange={(val) =>
                        field.onChange(
                          parseFloat(val.target.value.replace(',', '.'))
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={loading} type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
