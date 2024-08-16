import BloodGlucoseProvider from '@/components/blood-glucose'
import CarbsOnBoardProvider from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'

export default async function App() {
  return (
    <div className="space-y-2 w-full">
      <BloodGlucoseProvider />
      <InsulinOnBoardProvider />
      <CarbsOnBoardProvider />
    </div>
  )
}
