import { AutoReload } from '@/components/auto-reload'
import BloodGlucoseProvider from '@/components/blood-glucose'
import { CarbsOnBoard } from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'
import { TopBar } from '@/components/top-bar'

export default async function App() {
  return (
    <>
      <TopBar />
      <div className="p-2">
        <div className="space-y-2 w-full border rounded-sm">
          <AutoReload minutes={5} />
          <BloodGlucoseProvider />
          <InsulinOnBoardProvider />
          <CarbsOnBoard />
        </div>
      </div>
    </>
  )
}
