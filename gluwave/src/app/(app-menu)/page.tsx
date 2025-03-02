import CarbohydrateAbsorptionRate from '@/components/carbohydrate-absorption-rate'
import { Glucose } from '@/components/glucose/glucose'
import { InsulinOnBoard } from '@/components/insulin-on-board/insulin-on-board'
import { addHours, startOfHour, subHours } from 'date-fns'

export default async function App() {
  const now = new Date()
  const start = startOfHour(subHours(now, 24))
  const end = startOfHour(addHours(now, 24))

  return (
    <div className="mt-2 grid gap-2 mx-auto sm:grid-cols-2 max-w-5xl min-[420px]:px-2 md:px-4">
      <Glucose start={start} end={end} />
      <InsulinOnBoard start={start} end={end} />
      <CarbohydrateAbsorptionRate href="/carbs/list" start={start} end={end} />
    </div>
  )
}
