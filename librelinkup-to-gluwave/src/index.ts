import "dotenv/config";

import config from "./config.js";
import axios from "axios";

import { LibreLinkUpClient } from "@diakem/libre-link-up-api-client";
import { addMinutes, differenceInMinutes, parseISO, subHours } from "date-fns";

const { read } = LibreLinkUpClient({
  username: config.LIBRELINKUP_USERNAME,
  password: config.LIBRELINKUP_PASSWORD,
});

const wait = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const job = async () => {
  let retries = 0;

  try {
    retries++;
    console.log(`[${new Date().toLocaleString()}]: job`);

    const response = await read();

    const parsed = [];

    const { data: existingUpstreamGlucose } = await axios.get(
      new URL("/glucose/api", config.GLUWAVE_ENDPOINT).toString(),
      {
        params: {
          API_KEY: config.GLUWAVE_API_KEY,
        },
      }
    );

    for (const historicalValue of response.history) {
      if (historicalValue.date > subHours(new Date(), 36)) {
        const parsedHistoricalValue = {
          value: historicalValue.value,
          timestamp: addMinutes(
            historicalValue.date,
            config.TIMESTAMP_OFFSET - 2.5 // why 2.5? see https://github.com/Kalhama/Gluwave/issues/33
          ),
          device: "LIBRELINKUP",
        };

        const existingValue = existingUpstreamGlucose.find(
          (g) =>
            Math.abs(
              differenceInMinutes(
                parseISO(g.timestamp),
                parsedHistoricalValue.timestamp
              )
            ) < 2
        );

        if (!existingValue) {
          parsed.push(parsedHistoricalValue);
        }
      }
    }

    parsed.push({
      value: response.current.value,
      timestamp: addMinutes(response.current.date, config.TIMESTAMP_OFFSET),
      device: "LIBRELINKUP",
    });

    await axios.post(
      new URL("/glucose/api", config.GLUWAVE_ENDPOINT).toString(),
      parsed,
      {
        params: {
          API_KEY: config.GLUWAVE_API_KEY,
        },
      }
    );
  } catch (e) {
    if (retries >= 5) {
      throw e;
    } else {
      console.log(`retry number ${retries}`);
      console.error(e);
      await wait(Math.pow(retries, 4) * 1000);
    }
  }
};

if (config.SINGLE_SHOT_HISTORY) {
  job();
} else {
  while (true) {
    job();
    await wait(config.INTERVAL * 1000 * 60);
  }
}
