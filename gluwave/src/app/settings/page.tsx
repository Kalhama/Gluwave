import { validateRequest } from '@/auth'
import { notFound } from 'next/navigation'

import { ApiKeyForm } from './api-key-form'
import { Logout } from './logout'
import { Settings } from './settings'

export default async function SettingsProvider() {
  const { user } = await validateRequest()

  if (!user) return notFound()

  return (
    <div className="space-y-4">
      <Settings defaultValues={user} />
      <ApiKeyForm current={user.apikey} />
      <Logout />
    </div>
  )
}
