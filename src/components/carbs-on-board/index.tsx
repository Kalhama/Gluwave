import { validateRequest } from '@/auth'
import { calculateUserCarbsData } from '@/lib/sql_utils'
import { redirect } from 'next/navigation'

import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const data = await calculateUserCarbsData(user.id)

  return <CarbsOnBoard data={data} />
}
