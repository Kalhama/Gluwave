import { formatISO } from 'date-fns'
import { redirect } from 'next/navigation'

export default async function InsulinList() {
  const today = new Date()
  const iso = formatISO(today, { representation: 'date' })
  redirect(`/insulin/list/${iso}`)
}
