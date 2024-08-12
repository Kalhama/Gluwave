import { COB } from '@/lib/sql_utils'

import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
  const cob = await COB()

  return <CarbsOnBoard data={cob} />
}
