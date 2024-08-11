import { CarbsOnBoard } from './carbs-on-board'

export default async function CarbsOnBoardProvider() {
  const data: { timestamp: Date; insulinOnBoard: string }[] = [] // TODO query carbs on board

  return <CarbsOnBoard data={data} />
}
