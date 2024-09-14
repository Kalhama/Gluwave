'use client'

import { upsertInsulinAction } from '@/actions/upsert-insulin'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
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
import { cn } from '@/lib/utils'
import { upsertInsulinSchema } from '@/schemas/upsertInsulinSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { addMinutes, format, parse, set } from 'date-fns'
import { CalendarIcon, Syringe } from 'lucide-react'
import * as React from 'react'
import { PropsWithChildren, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface Props {
  insulin?: {
    amount: number
    timestamp: Date
    id: number
  }
}

export function InsulinDialog({ insulin, children }: PropsWithChildren<Props>) {
  const { action, loading, data, message } =
    useServerAction(upsertInsulinAction)
  const form = useForm<z.infer<typeof upsertInsulinSchema>>({
    resolver: zodResolver(upsertInsulinSchema),
    defaultValues: {
      amount: insulin?.amount ?? 0,
      timestamp: insulin?.timestamp ?? new Date(),
      id: insulin?.id,
    },
  })
  const editing = !!insulin?.id

  async function onSubmit(values: z.infer<typeof upsertInsulinSchema>) {
    await action(values)
    form.reset()
    setOpenChange(false)
  }

  const [open, setOpenChange] = useState(false)
  const [popoverOpen, popoverOnOpenChange] = useState(false)

  return (
    <Drawer
      open={open}
      onOpenChange={(s) => {
        form.reset()
        setOpenChange(s)
      }}
    >
      <DrawerTrigger asChild>
        <div>{children}</div>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-[350px] mx-auto">
        <DrawerHeader>
          <DrawerTitle>{editing ? 'Edit ' : 'Add '} insulin</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When</FormLabel>
                  <FormControl>
                    <div>
                      <div className="flex gap-1">
                        <Popover
                          modal
                          open={popoverOpen}
                          onOpenChange={(e) => popoverOnOpenChange(e)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 h-10 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  <span className="mr-2">
                                    {format(field.value, 'PPP')}
                                  </span>
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(e) =>
                                field.onChange(
                                  set(e || field.value, {
                                    hours: field.value.getHours(),
                                    minutes: field.value.getMinutes(),
                                    seconds: field.value.getSeconds(),
                                  })
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          value={format(field.value, 'HH:mm')}
                          onChange={(e) => {
                            const value = e.target.value
                            const date = parse(value, 'HH:mm', field.value)
                            field.onChange(date)
                          }}
                        />
                      </div>
                      <div className="flex mt-2 justify-stretch">
                        <Button
                          onClick={() =>
                            field.onChange(addMinutes(field.value, -15))
                          }
                          variant="outline"
                          type="button"
                          className="h-8"
                        >
                          -15
                        </Button>
                        <Button
                          onClick={() =>
                            field.onChange(addMinutes(field.value, -5))
                          }
                          variant="outline"
                          type="button"
                          className="h-8"
                        >
                          -5
                        </Button>
                        <Button
                          onClick={() => field.onChange(new Date())}
                          variant="outline"
                          type="button"
                          className="h-8"
                        >
                          Now
                        </Button>
                        <Button
                          onClick={() =>
                            field.onChange(addMinutes(field.value, 5))
                          }
                          variant="outline"
                          type="button"
                          className="h-8"
                        >
                          +5
                        </Button>
                        <Button
                          onClick={() =>
                            field.onChange(addMinutes(field.value, 15))
                          }
                          variant="outline"
                          type="button"
                          className="h-8"
                        >
                          +15
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      className="col-span-3"
                      value={field.value}
                      onChange={(val) => field.onChange(val.target.value)}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={loading} type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
