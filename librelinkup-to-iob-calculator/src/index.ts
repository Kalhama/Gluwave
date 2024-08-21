import "dotenv/config";

import config from "./config.js";
import axios from "axios";

import { LibreLinkUpClient } from "@diakem/libre-link-up-api-client";

const { read } = LibreLinkUpClient({
  username: config.LIBRELINKUP_USERNAME,
  password: config.LIBRELINKUP_PASSWORD,
});

const job = async (full: "full" | undefined) => {
  console.log(`[${new Date().toLocaleString()}]: job`);

  const response = await read();

  const parsed = [];

  if (full === "full") {
    const history = response.history.map((d) => {
      return {
        value: d.value,
        timestamp: d.date,
        device: "LIBRELINKUP",
      };
    });

    parsed.push(...history);
  }

  parsed.push({
    value: response.current.value,
    timestamp: response.current.date,
    device: "LIBRELINKUP",
  });

  await axios.post(config.IOB_CALC_ENDPOINT, parsed, {
    params: {
      API_KEY: config.IOB_CALC_API_KEY,
    },
  });
};

job("full");
setInterval(job, config.INTERVAL * 1000 * 60);
