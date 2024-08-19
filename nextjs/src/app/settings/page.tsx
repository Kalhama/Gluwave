import { validateRequest } from '@/auth'
import { notFound } from 'next/navigation'

import { Settings } from './Settings'

export default async function SettingsProvider() {
  const { user } = await validateRequest()

  if (!user) return notFound()

  return <Settings defaultValues={user} />
}
