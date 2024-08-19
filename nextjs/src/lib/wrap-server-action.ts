import { ServerActionError } from './server-action-error'

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// when doing server action you should do `export const action = wrapServerAction(yourAction)
export const wrapServerAction = <T, U extends any[]>(
  input: (...args: U) => Promise<T>
): ((...args: U) => Promise<ServerActionResult<T>>) => {
  return async (...args: U) => {
    try {
      const data = await input(...args)
      return {
        success: true,
        data,
      }
    } catch (e) {
      if (e instanceof ServerActionError) {
        return {
          success: false,
          error: e.message,
        }
      }

      throw e
    }
  }
}
