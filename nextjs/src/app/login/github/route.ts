import { generateState } from 'arctic'
import { cookies } from 'next/headers'

import { github } from '../../../auth'
import config from '../../../config.mjs'

export async function GET(): Promise<Response> {
  const state = generateState()
  const url = await github.createAuthorizationURL(state)

  cookies().set('github_oauth_state', state, {
    path: '/',
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  return Response.redirect(url)
}
