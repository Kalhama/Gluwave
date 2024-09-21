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

## Self hosting with docker-compose

1. `mkdir librelinkup-to-gluwave && cd librelinkup-to-gluwave`
2. `wget -O docker-compose.yml https://github.com/Kalhama/gluwave/blob/master/librelinkup-to-gluwave/docker-compose.yml`
3. Put following to `.env`

```shell
LIBRELINKUP_USERNAME=your_librelinkup_username
LIBRELINKUP_PASSWORD=your_librelinkup_password
GLUWAVE_ENDPOINT=https://app.gluwave.com/insulin/api
GLUWAVE_API_KEY= # Get your key from app.gluwave.com -> settings -> api key
INTERVAL=1 # How often to get glucose (minutes)
SINGLE_SHOT_HISTORY=false # Run once, but get history
TIMESTAMP_OFFSET=-5 # Glucose lag
```

4. `docker compose up -d`
