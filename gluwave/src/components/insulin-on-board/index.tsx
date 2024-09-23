import { validateRequest } from '@/auth'
import { calculateUserInsulinData } from '@/lib/sql_utils'
import { addHours, startOfMinute, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { InsulinOnBoard } from './insulin-on-board'

export default async function InsulinOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = startOfMinute(new Date())
  const data = await calculateUserInsulinData(
    subHours(now, 24),
    addHours(now, 12),
    user.id
  )

  return <InsulinOnBoard data={data} now={now} />
}
