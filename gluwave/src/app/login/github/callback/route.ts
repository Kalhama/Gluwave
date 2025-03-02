import { db } from '@/db'
import { userTable } from '@/schema'
import { OAuth2RequestError } from 'arctic'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'

import { createSession, github, setSessionCookie } from '../../../../auth'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = cookies().get('github_oauth_state')?.value ?? null

  if (!code || !state || !storedState || state !== storedState) {
    console.error(
      'wrong code, state, storedState, or state did not match storedState'
    )

    return new Response(null, {
      status: 400,
    })
  }

  try {
    const tokens = await github.validateAuthorizationCode(code)

    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    const githubUser: GitHubUser = await githubUserResponse.json()

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.githubId, githubUser.id))

    if (existingUser) {
      // Create a new session
      const session = await createSession(existingUser.id)

      // Set the session cookie
      setSessionCookie(session.id, session.expiresAt)

      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
        },
      })
    }

    // Create a new user
    const userId = nanoid()

    await db.insert(userTable).values({
      id: userId,
      githubId: githubUser.id,
    })

    // Create a new session
    const session = await createSession(userId)

    // Set the session cookie
    setSessionCookie(session.id, session.expiresAt)

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
      },
    })
  } catch (e) {
    // the specific error message depends on the provider
    console.error(e)
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      })
    }

    return new Response(null, {
      status: 500,
    })
  }
}

interface GitHubUser {
  id: string
  login: string
}
