import { validateRequest } from '@/auth'
import { Github } from '@/components/github'
import { buttonVariants } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function Page() {
  const { user } = await validateRequest()

  if (user) redirect('/')

  return (
    <div className="h-screen flex  justify-center items-center">
      <a className={buttonVariants()} href="/login/github">
        Sign in
        <div className="ml-3 h-6 w-6">
          <Github />
        </div>
      </a>
    </div>
  )
}
