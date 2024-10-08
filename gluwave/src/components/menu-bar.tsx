import { validateRequest } from '@/auth'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'
import React from 'react'

import { BurgerMenu } from './burger-menu'

interface Props {
  children?: React.ReactNode
  className?: string
}

export const MenuBar = async ({ children, className }: Props) => {
  const { session } = await validateRequest()
  if (!session) {
    return redirect('/login')
  }

  return (
    <div
      className={cn(
        'border-b shadow rounded-b-xl bg-white p-2 flex justify-end items-center min-h-12',
        className
      )}
    >
      {children}
      <BurgerMenu className="static" />
    </div>
  )
}
