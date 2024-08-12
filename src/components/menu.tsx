'use client'

import { validateRequest } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Menu as MenuIcon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

interface Props {
  authenticated: boolean
}

export const Menu = ({ authenticated }: Props) => {
  let links = (
    <>
      <Link className="hover:underline" href="/">
        Chart
      </Link>
      <Link className="hover:underline" href="/glucose/list">
        Blood glucose
      </Link>
      <Link className="hover:underline" href="/insulin/list">
        Insulin
      </Link>
      <Link className="hover:underline" href="/carbs/list">
        Carbs
      </Link>
      <Link className="hover:underline" href="/settings">
        Settings
      </Link>
      <a className="hover:underline" href="/logout">
        Logout
      </a>
    </>
  )

  if (!authenticated) {
    links = (
      <>
        <Link className="hover:underline" href="/login">
          Login
        </Link>
      </>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <Link href="/">
          <h1>App logo</h1>
        </Link>
        <div className="block md:hidden">
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="ghost">
                <MenuIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-[20rem] max-w-full rounded-none">
              <div className="p-4 pb-0 flex flex-col gap-2">{links}</div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="hidden md:flex gap-4">{links}</div>
      </div>
      <Separator orientation="horizontal" />
    </div>
  )
}
