import { db } from '@/db'
import { sessionTable, userTable } from '@/schema'
import { OAuth2RequestError } from 'arctic'
import { eq } from 'drizzle-orm'
import { generateIdFromEntropySize } from 'lucia'
import { cookies } from 'next/headers'

import { github, lucia } from '../../../../auth'

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

    // Replace this with your own DB client.
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.githubId, githubUser.id))

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )

      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
        },
      })
    }

    const userId = generateIdFromEntropySize(10) // 16 characters long

    await db.insert(userTable).values({
      id: userId,
      githubId: githubUser.id,
    })

    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

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
