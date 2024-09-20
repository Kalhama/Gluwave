'use client'

import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { Drawer } from 'vaul'

import { buttonVariants } from './ui/button'
import { Separator } from './ui/separator'

const links = [
  {
    href: '/',
    title: 'Home',
    exact: true,
  },
  {
    href: '/carbs/list',
    title: 'Carbohydrates',
    exact: false,
  },
  {
    href: '/insulin/list',
    title: 'Insulin',
    exact: false,
  },
  {
    href: '/glucose/list',
    title: 'Glucose',
    exact: false,
  },
  {
    href: '/settings',
    title: 'Settings',
    exact: false,
  },
]

export function BurgerMenu() {
  const [open, onOpenChange] = useState(false)
  const pathname = usePathname()

  return (
    <Drawer.Root onOpenChange={onOpenChange} open={open} direction="right">
      <Drawer.Trigger asChild>
        <Menu className="cursor-pointer absolute right-4 top-4" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-full w-[325px] mt-24 fixed bottom-0 right-0 focus:outline-none">
          <div className="p-4 bg-white flex-1 h-full">
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-medium mb-4">
                <div className="flex justify-between">
                  <Image
                    src={'/noslogan_transparent.png'}
                    width={400}
                    height={400}
                    alt={'logo'}
                    className="w-auto h-auto max-h-8"
                  />
                  <button
                    className="cursor-pointer"
                    onClick={() => onOpenChange(false)}
                    autoFocus
                  >
                    <X />
                  </button>
                </div>
              </Drawer.Title>
              <Separator className="my-6" />
              <nav className="flex flex-col h-full">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      (
                        item.exact
                          ? pathname === item.href
                          : pathname.includes(item.href)
                      )
                        ? 'bg-muted hover:bg-muted'
                        : 'hover:bg-transparent hover:underline',
                      'justify-start'
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
                <Link
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-8')}
                  prefetch={false}
                  href="/logout"
                >
                  Logout
                </Link>
              </nav>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
