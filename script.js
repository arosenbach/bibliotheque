import memjs from "memjs";
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
import dataFetcher from "./data-fetcher.js";
import { dateDiffInDays, checkEnv } from "./utils.js";

checkEnv([
  "MEMCACHIER_SERVERS",
  "MEMCACHIER_USERNAME",
  "MEMCACHIER_PASSWORD",
  "BIBLIO_EMAILS",
  "BIBLIO_CREDENTIALS",
]);

(async function () {
  const numDays = 5;
  const numDaysReminder = 1; // Reminder one day before the dead line
  const dest = process.env.BIBLIO_EMAILS.split(":").map((s) => s.trim());
  const TODAY = new Date();

  const sendMessage = (subject, html, to = dest) => {
    const msg = {
      to,
      from: dest[0],
      subject,
      html,
    };
    return sgMail
      .send(msg)
      .then(() => {
        console.info(`Message sent with subject "${subject}"`);
      })
      .catch((error) => {
        console.error(error.toString());
      });
  };

  const sendReport = (libraryName, books, when, reminder) => {
    const bookslen = books.length;
    if (bookslen > 0) {
      const msg = `
        <h2>Livre(s) à rendre (${libraryName}):</h2>
        <table>
        ${books
          .map(
            (book) => `
        	<tr>
        		<td>
            		<input type="checkbox" />
            	</td>
            	<td>
            		<img src="${book.coverUrl}" style="width: 100px;"/>
            	</td>
            	<td>
            		<label>${book.title}</label>
            	</td>
        `
          )
          .join("</tr>")}
        </table>
        `;
      const subject = `${
        reminder ? "Rappel: " : ""
      }${bookslen} livres à rendre pour ${when}`;
      return sendMessage(subject, msg);
    } else {
      return Promise.resolve();
    }
  };

  //
  const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    failover: false, // default: false
    timeout: 1, // default: 0.5 (seconds)
    keepAlive: false, // default: false
  });

  const lastRunValue = await mc.get("lastRun");
  let lastRun = new Date(null); // 1/1/1970
  if (lastRunValue.value) {
    lastRun = new Date(lastRunValue.value.toString("utf8"));
  }
  console.info(
    `Last run: ${lastRun.getDate()}/${
      lastRun.getMonth() + 1
    }/${lastRun.getFullYear()}`
  );
  // If last was today we do nothing...
  if (dateDiffInDays(lastRun, TODAY) === 0) {
    console.log("Already ran today, exiting...");
    process.exit(0);
  }

  //
  console.info(`fetching data...`);
  try {
    let loans;
    const loansValue = await mc.get("loans");
    if (loansValue.value) {
      console.log("CACHE HIT");
      loans = JSON.parse(loansValue.value.toString()).map((x) =>
        Promise.resolve(x)
      );
    } else {
      console.log("CACHE MISS");
      const credentials = JSON.parse(process.env.BIBLIO_CREDENTIALS);
      loans = dataFetcher.run(credentials);
    }

    await Promise.all(
      loans.map(async (data) => {
        const libraryData = await data;

        console.info(
          `=== ${libraryData.name} === \nFound ${libraryData.count} books\n${libraryData.remainingDays} days remaining.`
        );

        const booksFirstAlert = libraryData.loans.filter(
          (book) => book.days === numDays
        );
        const booksFirstReminder = libraryData.loans.filter(
          (book) => book.days === numDaysReminder
        );
        const booksLastReminder = libraryData.loans.filter(
          (book) => book.days === 0
        );

        await Promise.all([
          sendReport(
            libraryData.name,
            booksFirstAlert,
            `dans ${numDays} jours`
          ),
          sendReport(libraryData.name, booksFirstReminder, "demain", true),
          sendReport(libraryData.name, booksLastReminder, "aujourd'hui!", true),
        ]);
      })
    );

    await mc.set("lastRun", TODAY.toString(), { expires: 60 * 60 * 24 });
    loans = (await Promise.all(loans)).sort(
      (a, b) => a.remainingDays - b.remainingDays
    );
    await mc.set("loans", JSON.stringify(loans), { expires: 60 * 60 * 24 });
    await mc.delete("errorCnt");
    process.exit(0);
  } catch (e) {
    let errorCnt = (await mc.get("errorCnt")).value;
    errorCnt = errorCnt ? parseInt(errorCnt.toString("utf8"), 10) : 0;
    console.warn("ERROR! count: " + errorCnt);
    console.error(e);
    errorCnt += 1;
    if (errorCnt == 10) {
      console.info("Sending report by email...");
      const subject = "Problème avec le script bibliotheque";
      await sendMessage(
        subject,
        `${e.stack
          .replace(
            /[\u00A0-\u9999<>\&]/gim,
            (i) => "&#" + i.charCodeAt(0) + ";"
          )
          .replace(/\n/g, "<br>")
          .replace(/ /g, "&nbsp;")}`,
        dest[0]
      );
    }
    Promise.all([
      mc.set("errorCnt", errorCnt.toString(), { expires: 60 * 60 * 24 }),
      mc.delete("lastRun"),
    ]).then(() => process.exit(1));
  }
})();
