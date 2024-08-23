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
  SINGLE_SHOT_HISTORY: z
    .string()
    .toLowerCase()
    .transform((x) => x === "true")
    .pipe(z.boolean()),
});

const config = schema.parse(process.env);

export default config;
