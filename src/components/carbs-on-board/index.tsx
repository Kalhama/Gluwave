import { validateRequest } from '@/auth'
import { calculateUserCarbsData } from '@/lib/sql_utils'

import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    throw new Error('not authenticated')
  }

  const data = await calculateUserCarbsData(user.id)

  return <CarbsOnBoard data={data} />
}
