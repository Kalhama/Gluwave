import { db } from '@/db'
import { settings } from '@/schema'

import { Settings } from './Settings'

export default async function SettingsProvider() {
  const defaultValues = (await db.select().from(settings).limit(1))[0]

  return <Settings defaultValues={defaultValues} />
}
