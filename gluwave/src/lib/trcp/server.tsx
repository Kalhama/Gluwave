import { appRouter } from '@/server'
import { createContext } from '@/server/context'
import { createCallerFactory } from '@/server/trpc'
// <-- ensure this file cannot be imported from the client
import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { cache } from 'react'
import 'server-only'

import { makeQueryClient } from './query-client'

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)
const caller = createCallerFactory(appRouter)(await createContext())
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
)
