'server only'

// @ts-check
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.string(),
  GITHUB_ID: z.string(),
  GITHUB_SECRET: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().positive(),
  DB_USER: z.string(),
  DB_DATABASE: z.string(),
  DB_SSL: z.enum(['true', 'false']).transform((value) => value === 'true'),
  DB_PASSWORD: z.string(),
})
const config = schema.parse(process.env)
export default config
