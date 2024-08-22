'use client'

import { addGlucosenAction } from '@/actions/add-glucose'
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
import { addGlucoseSchema } from '@/schemas/addGlucoseSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Droplet } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export function BloodGlucoseDialog() {
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
    <Drawer
      open={open}
      onOpenChange={(s) => {
        form.reset()
        setOpenChange(s)
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="link">
          <Droplet />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-[325px] mx-auto">
        <DrawerHeader>
          <DrawerTitle>Add glucose measurement manually</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="timedelta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
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
