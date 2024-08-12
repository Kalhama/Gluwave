import { validateRequest } from '@/auth'
import { db } from '@/db'
import { glucose } from '@/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { BloodGlucose } from './blood-glucose'

export default async function BloodGlucoseProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const data = await db
    .select({
      timestamp: glucose.timestamp,
      value: glucose.value,
    })
    .from(glucose)
    .where(eq(glucose.userId, user.id))
    .orderBy(glucose.timestamp)

  return <BloodGlucose data={data} />
}
