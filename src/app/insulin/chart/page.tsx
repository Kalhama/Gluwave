import { db } from '@/db'
import { insulin_on_board } from '@/schema'

import { InsulinOnBoardChart } from './InsulinOnBoardChart'

export default async function InsulinOnBoard() {
  const data = await db.select().from(insulin_on_board)

  return <InsulinOnBoardChart data={data} />
}
