# librelinkup to iob-calculator integration

This project is a integration script that integrates data from librelinkup to the iob-calculator service.

Following environment variables must be set

| Variable name        | Description                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| LIBRELINKUP_USERNAME | Your username / email to librelinkup service. Example: `example@example.com`                 |
| LIBRELINKUP_PASSWORD | Your password to librelinkup service. Example: `password`                                    |
| IOB_CALC_ENDPOINT    | Endpoint for Nextjs service. Example: `https://iob-calculator-nextjs.vercel.com/insulin/api` |
| IOB_CALC_API_KEY     | API key that can be generated in settings. Example: `Z4_g-aZAvfsK9hzypdf0s`                  |
| INTERVAL             | How often we should try to get data form libre and push it to iob-calc. Example: `5`         |
| SINGLE_SHOT_HISTORY  | Should we stream results or just single shot history once. Example: `false`                  |
| TIMESTAMP_OFFSET     | How many minutes to offset timestamps in GCM data. Example: `-5`                             |
