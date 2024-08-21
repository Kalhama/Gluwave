import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .string()
    .optional()
    .transform((v) => v ?? "development"),
  LIBRELINKUP_USERNAME: z.string(),
  LIBRELINKUP_PASSWORD: z.string(),
  IOB_CALC_ENDPOINT: z.string(),
  IOB_CALC_API_KEY: z.string(),
  INTERVAL: z.coerce.number().gte(1),
});

const config = schema.parse(process.env);

export default config;
