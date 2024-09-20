import { validateRequest } from '@/auth'
import { AutoReload } from '@/components/auto-reload'
import BloodGlucoseProvider from '@/components/blood-glucose'
import { CarbsOnBoard } from '@/components/carbs-on-board'
import { GlucoseBar } from '@/components/glucose-bar'
import InsulinOnBoardProvider from '@/components/insulin-on-board'
import { Toolbar } from '@/components/toolbar'
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
      <GlucoseBar />

      <div className="space-y-2 w-full p-2 max-w-md mx-auto">
        <AutoReload minutes={5} />
        <BloodGlucoseProvider />
        <InsulinOnBoardProvider />
        <CarbsOnBoard />
      </div>

      <Toolbar authenticated={!!user} />
    </>
  )
}
