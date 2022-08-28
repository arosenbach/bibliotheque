import HtmlParser from "./html-parser.js";
import HttpClient from "./http-client.js";
import { dateDiffInDays, sortBy, debug } from "./utils.js";

const computeRemainingDays = (loans) => {
  const today = new Date();
  return loans
    .map((book) => ({
      title: book.title,
      coverUrl: book.coverUrl,
      days: dateDiffInDays(today, new Date(book.date)),
    }))
    .sort((a, b) => a.days - b.days);
};

const injectLastRun = (data) =>
  data.reduce(
    (acc, next) => ({
      lastRun: acc.lastRun,
      data: [...acc.data, next],
    }),
    {
      lastRun: new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }),
      data: [],
    }
  );

const cacheSave = (memjsClient) => async (data) => {
  try {
    await memjsClient.set("loans", JSON.stringify(data), {
      expires: 60 * 60 * 24,
    });
  } catch (error) {
    console.error(error);
  }
  return data;
};


export default class DataFetcher {
  constructor(memjsClient, credentials) {
    this.memjsClient = memjsClient;
    this.credentials = credentials;
  }

  run() {
    const promises = this.credentials.map(async (creds) => {
      const httpClient = new HttpClient(creds);
      const loansHtml = await httpClient.fetchLoans();
      debug("loansHtml", loansHtml.length);
      const htmlParser = new HtmlParser(loansHtml);
      const loansData = htmlParser.extractData();
      debug("loansData", loansData.length);
      const loans = computeRemainingDays(loansData);
      debug("loans", loans);
      return {
        remainingDays: loans[0].days,
        loans,
        name: creds.name,
        count: loans.length,
      };
    });
    return Promise.all(promises)
      .then(sortBy("remainingDays"))
      .then(injectLastRun)
      .then(cacheSave(this.memjsClient));
  }
}
