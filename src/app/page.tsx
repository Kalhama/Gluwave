import BloodGlucoseProvider from '@/components/blood-glucose'
import CarbsOnBoardProvider from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'

export default async function App() {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <InsulinOnBoardProvider />
      <CarbsOnBoardProvider />
      <BloodGlucoseProvider />
    </div>
  )
}
