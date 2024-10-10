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

interface Props {
  className?: string
}

export function BurgerMenu({ className }: Props) {
  const [open, onOpenChange] = useState(false)
  const pathname = usePathname()

  return (
    <Drawer.Root onOpenChange={onOpenChange} open={open} direction="right">
      <Drawer.Trigger asChild>
        <Menu
          className={cn('cursor-pointer absolute right-4 top-4', className)}
        />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-20 bg-black/40" />
        <Drawer.Content
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
          className="bg-white flex flex-col z-50 rounded-t-[10px] h-full w-[325px] mt-24 fixed bottom-0 right-0 focus:outline-none"
        >
          <div className="p-4 bg-white flex-1 h-full">
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-medium mb-4">
                <div className="flex justify-between">
                  <Link href="/">
                    <Image
                      priority
                      overrideSrc={
                        ' data:image/png;base64,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'
                      }
                      width={400}
                      height={400}
                      alt={'logo'}
                      className="w-auto h-auto max-h-8"
                      src={''}
                    />
                  </Link>
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
                    onClick={() => onOpenChange(false)}
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
