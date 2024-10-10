import { validateRequest } from '@/auth'
import { GlucoseBar } from '@/components/glucose-bar'
import { Toolbar } from '@/components/toolbar'
import { db } from '@/db'
import { glucose } from '@/schema'
import { subHours } from 'date-fns'
import { and, desc, eq, gte } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await validateRequest()

  if (!user) return {}

  const [last] = await db
    .select()
    .from(glucose)
    .where(
      and(
        eq(glucose.userId, user.id),
        gte(glucose.timestamp, subHours(new Date(), 1))
      )
    )
    .orderBy(desc(glucose.timestamp))
    .limit(1)

  if (last?.value) {
    return {
      title: `${last.value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} mmol/l`,
    }
  }

  return {}
}

export default async function AppMenuLayouit({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await validateRequest()

  if (!user) redirect('/login')

  return (
    <div className="pb-32 min-h-screen">
      <GlucoseBar />
      {children}
      <Toolbar authenticated={!!user} />
    </div>
  )
}
