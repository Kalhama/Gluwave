'server only'

// @ts-check
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z
    .string()
    .optional()
    .transform((v) => v ?? 'development'),
  GITHUB_ID: z.string(),
  GITHUB_SECRET: z.string(),
  DATABASE_URL: z.string(),
  DATABASE_URL_UNPOOLED: z.string(),
  TZ: z.literal('UTC'),
  NEXT_PUBLIC_URL: z.string(),
})
const config = schema.parse(process.env)
export default config
