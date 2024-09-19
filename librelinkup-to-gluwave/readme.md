# Librelinkup to Gluwave integration

This project is a integration script that integrates data from Librelinkup to the Gluwave service.

Following environment variables must be set

| Variable name        | Description                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| LIBRELINKUP_USERNAME | Your username / email to librelinkup service. Example: `example@example.com`        |
| LIBRELINKUP_PASSWORD | Your password to librelinkup service. Example: `password`                           |
| GLUWAVE_ENDPOINT     | Endpoint for Nextjs service. Example: `https://gluwave-5392.vercel.com/insulin/api` |
| GLUWAVE_API_KEY      | API key that can be generated in settings. Example: `Z4_g-aZAvfsK9hzypdf0s`         |
| INTERVAL             | How often we should try to get data form libre and push it to Gluwave. Example: `5` |
| SINGLE_SHOT_HISTORY  | Should we stream results or just single shot history once. Example: `false`         |
| TIMESTAMP_OFFSET     | How many minutes to offset timestamps in GCM data. Example: `-5`                    |
