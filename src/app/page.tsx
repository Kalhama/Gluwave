import CarbsOnBoardProvider from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'

export default async function App() {
  return (
    <main className="w-full h-screen flex flex-col justify-center items-center gap-4">
      <InsulinOnBoardProvider />
      <CarbsOnBoardProvider />
    </main>
  )
}
