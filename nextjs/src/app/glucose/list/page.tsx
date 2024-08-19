import { formatISO } from 'date-fns'
import { redirect } from 'next/navigation'

export default async function BloodGlucoseList() {
  const today = new Date()
  const iso = formatISO(today, { representation: 'date' })
  redirect(`/glucose/list/${iso}`)
}
