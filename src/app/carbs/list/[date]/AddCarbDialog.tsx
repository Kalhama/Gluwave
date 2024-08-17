'use client'

import { addCarbAction } from '@/actions/addCarb'
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
import { addCarbSchema } from '@/schemas/addCarbSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { UtensilsCrossed } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export function AddCarbDialog() {
  const { action, loading, data, message } = useServerAction(addCarbAction)
  const form = useForm<z.infer<typeof addCarbSchema>>({
    resolver: zodResolver(addCarbSchema),
    defaultValues: {
      amount: 0,
      timedelta: 0,
      decay: 60,
    },
  })

  async function onSubmit(values: z.infer<typeof addCarbSchema>) {
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
        <Button variant="link">
          <UtensilsCrossed />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add carbs</DialogTitle>
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
                          {Array.from({ length: 9 }).map((_, i) => {
                            const value = ((9 - 1) / 2) * 15 - i * 15
                            return (
                              <SelectItem value={String(value)} key={i}>
                                {value === 0 ? 'Now' : `${value} min`}
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
                      type="number"
                      className="col-span-3"
                      value={field.value}
                      onChange={(val) =>
                        field.onChange(Number(val.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="decay"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Decay</FormLabel>
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
                            <SelectItem value={'30'}>0,5h</SelectItem>
                            <SelectItem value={'60'}>1h</SelectItem>
                            <SelectItem value={'90'}>1,5h</SelectItem>
                            <SelectItem value={'120'}>2h</SelectItem>
                            <SelectItem value={'180'}>3h</SelectItem>
                            <SelectItem value={'240'}>4h</SelectItem>
                            <SelectItem value={'360'}>6h</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )
              }}
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
