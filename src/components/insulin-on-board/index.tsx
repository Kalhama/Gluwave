import { IOB } from '@/lib/sql_utils'

import { InsulinOnBoard } from './insulin-on-board'

export default async function InsulinOnBoardProvider() {
  const data = await IOB()

  return <InsulinOnBoard data={data} />
}
