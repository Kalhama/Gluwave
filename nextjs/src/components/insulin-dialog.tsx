'use client'

import { addInsulinAction } from '@/actions/add-insulin'
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
import { addInsulinSchema } from '@/schemas/addInsulinSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Syringe } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export function InsulinDialog() {
  const { action, loading, data, message } = useServerAction(addInsulinAction)
  const form = useForm<z.infer<typeof addInsulinSchema>>({
    resolver: zodResolver(addInsulinSchema),
    defaultValues: {
      amount: 0,
      timedelta: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof addInsulinSchema>) {
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
          <Syringe />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-[325px] mx-auto">
        <DrawerHeader>
          <DrawerTitle>Add insulin</DrawerTitle>
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
