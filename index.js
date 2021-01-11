import express from "express";
import dataFetcher from "./data-fetcher.js";
import memjs from "memjs";
import { dateDiffInDays, checkEnv } from "./utils.js";

checkEnv([
  "MEMCACHIER_SERVERS",
  "MEMCACHIER_USERNAME",
  "MEMCACHIER_PASSWORD",
  "BIBLIO_EMAILS",
  "BIBLIO_BASE_URL",
  "BIBLIO_USERNAME",
  "BIBLIO_PASSWORD",
]);

const app = express();

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: false, // default: false
  timeout: 1, // default: 0.5 (seconds)
  keepAlive: false, // default: false
});

app.get("/loans", async (req, res) => {
  try {
    const lastRunValue = await mc.get("lastRun");
    let lastRun = new Date(null); // 1/1/1970
    if (lastRunValue.value) {
      lastRun = new Date(lastRunValue.value.toString("utf8"));
    }

    const today = new Date();
    let loans;
    if (dateDiffInDays(lastRun, today) === 0) {
      const loansValue = await mc.get("loans");
      if (loansValue.value) {
        console.log("CACHE HIT");
        res.status(200).json(JSON.parse(loansValue.value.toString()));
        return;
      }
    }

    console.log("CACHE MISS");
    const credentials = JSON.parse(process.env.BIBLIO_CREDENTIALS);
    loans = (await Promise.all(dataFetcher.run(credentials))).sort(
      (a, b) => a.remainingDays - b.remainingDays
    );
    res.status(200).json(loans);
    await mc.set("loans", JSON.stringify(loans), { expires: 60 * 60 * 24 });
    return;
  } catch (e) {
    console.error(e);
  }
});

app.listen(app.listen(process.env.PORT || 8080), () => {
  console.log("REST API Server running...");
});
