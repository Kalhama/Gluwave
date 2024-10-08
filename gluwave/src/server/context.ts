import { validateRequest } from '@/auth'

export async function createContext() {
  return validateRequest()
}
export type Context = Awaited<ReturnType<typeof createContext>>
