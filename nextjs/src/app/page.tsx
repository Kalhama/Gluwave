import { AutoReload } from '@/components/auto-reload'
import BloodGlucoseProvider from '@/components/blood-glucose'
import CarbsProvider from '@/components/carbs'
import CarbsOnBoardProvider from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'

export default async function App() {
  return (
    <div className="space-y-2 w-full">
      <AutoReload minutes={5} />
      <BloodGlucoseProvider />
      <InsulinOnBoardProvider />
      <CarbsOnBoardProvider />
      <CarbsProvider />
    </div>
  )
}
