import { GitHub } from 'arctic'
import { InferSelectModel, gte } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'

import config from './config.mjs'
import { db } from './db'
import { apiKeyTable, sessionTable, userTable } from './schema'

// Session cookie name
const SESSION_COOKIE_NAME = 'auth_session'
export const API_KEY_HEADER_NAME = 'apikey'

// Create GitHub OAuth provider
export const github = new GitHub(config.GITHUB_ID, config.GITHUB_SECRET)

// Type for user attributes from the database
export type DatabaseUserAttributes = InferSelectModel<typeof userTable>
export type Session = InferSelectModel<typeof sessionTable>

// Function to create a new session
export async function createSession(
  userId: string,
  expiresIn: number = 60 * 60 * 24 * 30
) {
  // Generate a random session ID
  const sessionId = nanoid()

  // Calculate expiration date (default: 30 days)
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  // Insert session into database
  await db.insert(sessionTable).values({
    id: sessionId,
    userId: userId,
    expiresAt: expiresAt,
  })

  return {
    id: sessionId,
    userId,
    expiresAt,
  }
}

// Function to set session cookie
export function setSessionCookie(sessionId: string, expires?: Date) {
  cookies().set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expires,
    sameSite: 'lax',
  })
}

// Function to clear session cookie
export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  })
}

// Function to invalidate a session
export async function invalidateSession(sessionId: string) {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId))
}

export const validateApiRequest = cache(async () => {
  const key = headers().get(API_KEY_HEADER_NAME)

  if (!key) {
    return {
      user: null,
    }
  }

  const [res] = await db
    .select()
    .from(apiKeyTable)
    .leftJoin(userTable, eq(userTable.id, apiKeyTable.userId))
    .where(eq(apiKeyTable.key, key))

  if (!res?.apikey || !res?.user) {
    return {
      user: null,
    }
  }

  return {
    user: res.user,
  }
})

// Function to validate request and get user
export const validateRequest = cache(
  async (): Promise<
    | { user: DatabaseUserAttributes; session: Session }
    | { user: null; session: null }
  > => {
    const sessionId = cookies().get(SESSION_COOKIE_NAME)?.value ?? null

    if (!sessionId) {
      return {
        user: null,
        session: null,
      }
    }

    // Get session from database
    const [session] = await db
      .select()
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.id, sessionId),
          gte(sessionTable.expiresAt, new Date())
        )
      )

    // If session doesn't exist or is expired, clear cookie and return null
    if (!session) {
      clearSessionCookie()
      return {
        user: null,
        session: null,
      }
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.userId))

    // If user doesn't exist, clear cookie and return null
    if (!user) {
      clearSessionCookie()
      return {
        user: null,
        session: null,
      }
    }

    return {
      user,
      session,
    }
  }
)
