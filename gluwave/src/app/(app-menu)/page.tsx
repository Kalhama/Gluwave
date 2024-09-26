import { validateRequest } from '@/auth'
import BloodGlucose from '@/components/blood-glucose'
import { CarbohydratesOnBoard } from '@/components/carbohydrates-on-board'
import InsulinOnBoard from '@/components/insulin-on-board'
import { db } from '@/db'
import { glucose } from '@/schema'
import { addMinutes } from 'date-fns'
import { and, desc, eq, gte } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

const getLastGlucose = async (userId: string): Promise<number | undefined> => {
  const [last] = await db
    .select()
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, userId),
        gte(glucose.timestamp, addMinutes(new Date(), -60))
      )
    )
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  return last?.value
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const last = await getLastGlucose(user.id)

  if (!last) {
    return {}
  }

  return {
    title: `${last.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mmol/l`,
  }
}

export default async function App() {
  return (
    <div className="mt-2 grid gap-2 mx-auto sm:grid-cols-2 max-w-5xl min-[420px]:px-2 md:px-4">
      <BloodGlucose />
      <InsulinOnBoard />
      <CarbohydratesOnBoard />
      {/* <ObservedCarbs /> */}
    </div>
  )
}
