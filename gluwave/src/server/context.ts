import { validateApiRequest, validateRequest } from '@/auth'

export async function createContext() {
  return validateRequest()
}

export async function createApiContext() {
  return validateApiRequest()
}
export type ApiContext = Awaited<ReturnType<typeof createApiContext>>
