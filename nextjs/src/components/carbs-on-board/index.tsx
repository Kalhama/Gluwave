import { validateRequest } from '@/auth'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { addHours, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const data = await calculateUserCarbsData(
    subHours(now, 24),
    addHours(now, 24),
    user.id
  )

  return <CarbsOnBoard data={data} />
}
