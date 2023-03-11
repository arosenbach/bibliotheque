import memjs from "memjs";
import DataFetcher from "./data-fetcher.js";
import { checkEnv } from "./utils.js";
import Notifier from "./notifier.js";

checkEnv([
  "MEMCACHIER_SERVERS",
  "MEMCACHIER_USERNAME",
  "MEMCACHIER_PASSWORD",
  "BIBLIO_EMAILS",
  "BIBLIO_EMAILS_SENDER",
  "BIBLIO_CREDENTIALS",
]);

const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: false, // default: false
  timeout: 1, // default: 0.5 (seconds)
  keepAlive: false, // default: false
});

const dest = process.env.BIBLIO_EMAILS.split(":").map((s) => s.trim());
const notifier = new Notifier(process.env.BIBLIO_EMAILS_SENDER, dest);

(async function (numDays, numDaysReminder) {
  //
  console.info(`fetching data...`);
  try {
    let loans;
    const loansValue = await mc.get("loans");
    if (loansValue.value) {
      console.log("CACHE HIT");
      loans = JSON.parse(loansValue.value.toString());
    } else {
      console.log("CACHE MISS");
      const credentials = JSON.parse(process.env.BIBLIO_CREDENTIALS);
      const dataFetcher = new DataFetcher(mc, credentials);
      loans = await dataFetcher.run();
    }

    await Promise.allSettled(
      loans.data.map(async (libraryData) => {
        console.info(`=== ${libraryData.name} ===`);
        console.info(
          libraryData.count
            ? `Found ${libraryData.count} books`
            : `No books found`
        );
        if (libraryData.count) {
          console.info(`${libraryData.remainingDays} days remaining.`);
        }

        const booksFirstAlert = libraryData.loans.filter(
          (book) => book.days === numDays
        );
        const booksFirstReminder = libraryData.loans.filter(
          (book) => book.days === numDaysReminder
        );
        const booksLastReminder = libraryData.loans.filter(
          (book) => book.days === 0
        );

        await Promise.allSettled([
          notifier.sendReport(
            libraryData.name,
            booksFirstAlert,
            `dans ${numDays} jours`
          ),
          notifier.sendReport(
            libraryData.name,
            booksFirstReminder,
            "demain",
            true
          ),
          notifier.sendReport(
            libraryData.name,
            booksLastReminder,
            "aujourd'hui!",
            true
          ),
        ]);
      })
    );
    await mc.delete("errorCnt");
    process.exit(0);
  } catch (e) {
    let errorCnt = (await mc.get("errorCnt")).value;
    errorCnt = errorCnt ? parseInt(errorCnt.toString("utf8"), 10) : 1;
    console.warn("ERROR! count: " + errorCnt);
    console.error(e);
    errorCnt += 1;
    if (errorCnt == 10) {
      console.info("Sending report by email...");
      const subject = "Problème avec le script bibliotheque";
      await notifier.sendMessage(
        subject,
        `${e.stack
          .replace(
            /[\u00A0-\u9999<>\&]/gim,
            (i) => "&#" + i.charCodeAt(0) + ";"
          )
          .replace(/\n/g, "<br>")
          .replace(/ /g, "&nbsp;")}`
      );
    }
    Promise.allSettled([
      mc.set("errorCnt", errorCnt.toString(), { expires: 60 * 60 * 24 }),
    ]).then(() => process.exit(1));
  }
})(5, 1);
