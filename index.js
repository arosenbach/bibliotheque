import express from "express";
import DataFetcher from "./data-fetcher.js";
import memjs from "memjs";
import { checkEnv } from "./utils.js";

checkEnv([
  "MEMCACHIER_SERVERS",
  "MEMCACHIER_USERNAME",
  "MEMCACHIER_PASSWORD",
  "BIBLIO_EMAILS",
  "BIBLIO_CREDENTIALS",
]);

const app = express();

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: false, // default: false
  timeout: 1, // default: 0.5 (seconds)
  keepAlive: false, // default: false
});

app.get("/loans", async (req, res) => {
  try {
    const loansValue = await mc.get("loans");
    if (loansValue.value) {
      console.log("CACHE HIT");
      res.status(200).json(JSON.parse(loansValue.value.toString()));
      return;
    }

    console.log("CACHE MISS");
    const credentials = JSON.parse(process.env.BIBLIO_CREDENTIALS);
    const dataFetcher = new DataFetcher(mc, credentials);
    const loans = await dataFetcher.run();
    res.status(200).json(loans.data);
    return;
  } catch (e) {
    console.error(e);
  }
});

app.listen(app.listen(process.env.PORT || 8080), () => {
  console.log(`REST API Server running on port ${process.env.PORT || 8080}...`);
});
