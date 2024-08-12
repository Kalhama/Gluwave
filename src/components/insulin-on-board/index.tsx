import { validateRequest } from '@/auth'
import { calculateUserInsulinData } from '@/lib/sql_utils'
import { redirect } from 'next/navigation'

import { InsulinOnBoard } from './insulin-on-board'

export default async function InsulinOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const data = await calculateUserInsulinData(user.id)

  return <InsulinOnBoard data={data} />
}
