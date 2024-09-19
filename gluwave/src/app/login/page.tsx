import { validateRequest } from '@/auth'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function Page() {
  const { user } = await validateRequest()

  if (user) redirect('/')

  return (
    <div className="h-screen flex  justify-center items-center">
      <Button>
        <a href="/login/github">Sign in with GitHub</a>
      </Button>
    </div>
  )
}
