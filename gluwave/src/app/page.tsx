import { validateRequest } from '@/auth'
import { AutoReload } from '@/components/auto-reload'
import BloodGlucoseProvider from '@/components/blood-glucose'
import { CarbsOnBoard } from '@/components/carbs-on-board'
import InsulinOnBoardProvider from '@/components/insulin-on-board'
import { Menu } from '@/components/menu'
import { TopBar } from '@/components/top-bar'
import { db } from '@/db'
import { glucose } from '@/schema'
import { and, desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

const getLastGlucose = async (userId: string) => {
  const [last] = await db
    .select()
    .from(glucose)
    .where(and(eq(glucose.userId, userId)))
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  return last
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const last = await getLastGlucose(user.id)

  return {
    title: `${last.value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mmol/l`,
  }
}

export default async function App() {
  const { user } = await validateRequest()

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
      <Menu authenticated={!!user} />
    </>
  )
}
