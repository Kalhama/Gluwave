import { db } from '@/db'
import { insulin_on_board } from '@/schema'

import { InsulinOnBoard } from './InsulinOnBoard'

export default async function InsulinOnBoardProvider() {
  const data = await db.select().from(insulin_on_board)

  return <InsulinOnBoard data={data} />
}
