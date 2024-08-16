import { validateRequest } from '@/auth'
import { calculateUserInsulinData, getData } from '@/lib/sql_utils'
import { subDays } from 'date-fns'
import { redirect } from 'next/navigation'

import { InsulinOnBoard } from './insulin-on-board'

export default async function InsulinOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  await getData(subDays(new Date(), 1), new Date(), user.id)

  const data = await calculateUserInsulinData(user.id)

  return <InsulinOnBoard data={data} />
}
