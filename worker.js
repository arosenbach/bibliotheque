import DataFetcher from "./data-fetcher.js";
import { checkEnv } from "./utils.js";

checkEnv(["MEMCACHIER_SERVERS", "MEMCACHIER_USERNAME", "MEMCACHIER_PASSWORD"]);

import memjs from "memjs";

const mc = process.env.BIBLIO_DEBUG
  ? { set: () => 1 }
  : memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
      failover: false, // default: false
      timeout: 1, // default: 0.5 (seconds)
      keepAlive: false, // default: false
    });

try {
  const credentials = JSON.parse(process.env.BIBLIO_CREDENTIALS);
  const dataFetcher = new DataFetcher(mc, credentials);
  const loans = await dataFetcher.run();
  console.log(JSON.stringify(loans));
  process.exit(0);
} catch (e) {
  console.error(e);
}
