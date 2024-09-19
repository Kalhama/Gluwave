import "dotenv/config";

import config from "./config.js";
import axios from "axios";

import { LibreLinkUpClient } from "@diakem/libre-link-up-api-client";
import { addMinutes } from "date-fns";

const { read } = LibreLinkUpClient({
  username: config.LIBRELINKUP_USERNAME,
  password: config.LIBRELINKUP_PASSWORD,
});

let retries = 0;

const job = async (full: "full" | undefined) => {
  try {
    retries++;
    console.log(`[${new Date().toLocaleString()}]: job`);

    const response = await read();

    const parsed = [];

    if (full === "full") {
      const history = response.history.map((d) => {
        return {
          value: d.value,
          timestamp: addMinutes(d.date, config.TIMESTAMP_OFFSET),
          device: "LIBRELINKUP",
        };
      });

      parsed.push(...history);
    }

    parsed.push({
      value: response.current.value,
      timestamp: addMinutes(response.current.date, config.TIMESTAMP_OFFSET),
      device: "LIBRELINKUP",
    });

    await axios.post(config.GLUWAVE_ENDPOINT, parsed, {
      params: {
        API_KEY: config.GLUWAVE_API_KEY,
      },
    });

    retries = 0;
  } catch (e) {
    if (retries >= 5) {
      throw e;
    } else {
      console.log(`retry number ${retries}`);
      console.error(e);
    }
  }
};

if (config.SINGLE_SHOT_HISTORY) {
  job("full");
} else {
  job(undefined);
  setInterval(job, config.INTERVAL * 1000 * 60);
}
