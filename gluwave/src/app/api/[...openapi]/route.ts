import { appRouter } from '@/server'
import { createApiContext } from '@/server/context'
import { NextRequest } from 'next/server'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

export const dynamic = 'force-dynamic'

const handler = (req: NextRequest) => {
  // Handle incoming OpenAPI requests
  return createOpenApiFetchHandler({
    endpoint: '/api',
    router: appRouter,
    createContext: () => createApiContext(),
    req,
  })
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
}
