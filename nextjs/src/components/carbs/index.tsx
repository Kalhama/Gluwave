import { validateRequest } from '@/auth'
import { observedCarbs } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { Carbs } from './carbs'

export default async function CarbsProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()

  const data = await observedCarbs(
    subHours(now, 24),
    addHours(now, 24),
    user.id
  )

  return <Carbs observedCarbs={data} />
}
