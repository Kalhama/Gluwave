import { clearSessionCookie, invalidateSession, validateRequest } from '@/auth'
import { redirect } from 'next/navigation'

export async function GET(): Promise<Response> {
  const { session } = await validateRequest()

  clearSessionCookie()

  if (session) {
    await invalidateSession(session.id)
  }

  return redirect('/login')
}
