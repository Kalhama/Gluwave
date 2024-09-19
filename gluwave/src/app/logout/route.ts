import { lucia, validateRequest } from '@/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(): Promise<Response> {
  const { session } = await validateRequest()

  if (!session) redirect('/login')

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )
  return redirect('/login')
}
