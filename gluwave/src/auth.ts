import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { GitHub } from 'arctic'
import { InferSelectModel } from 'drizzle-orm'
import { Lucia } from 'lucia'
import type { Session, User } from 'lucia'
import { cookies } from 'next/headers'
import { cache } from 'react'

import config from './config.mjs'
import { db } from './db'
import { sessionTable, userTable } from './schema'

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      githubId: attributes.githubId,
      id: attributes.id,
      carbohydrateRatio: attributes.carbohydrateRatio,
      correctionRatio: attributes.correctionRatio,
      target: attributes.target,
      insulinOnBoardOffset: attributes.insulinOnBoardOffset,
      apikey: attributes.apikey,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

export const github = new GitHub(config.GITHUB_ID!, config.GITHUB_SECRET!)

type DatabaseUserAttributes = InferSelectModel<typeof userTable>

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null
    if (!sessionId) {
      return {
        user: null,
        session: null,
      }
    }

    const result = await lucia.validateSession(sessionId)
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        )
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        )
      }
    } catch {}
    return result
  }
)
