import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  // IDK why but this fixes the types
  const t = {
    ctx,
  }

  return next(t)
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const createCallerFactory = t.createCallerFactory
