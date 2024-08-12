import { validateRequest } from '@/auth'
import { calculateUserInsulinData } from '@/lib/sql_utils'

import { InsulinOnBoard } from './insulin-on-board'

export default async function InsulinOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    throw new Error('not authenticated')
  }

  const data = await calculateUserInsulinData(user.id)

  return <InsulinOnBoard data={data} />
}
