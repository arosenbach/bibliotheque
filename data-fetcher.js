import fetch from "node-fetch";
import * as Cheerio from "cheerio";
import { dateDiffInDays } from "./utils.js";

async function pretsNotLoggedIn(url) {
  return fetch(`${url}/abonne/prets`, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "max-age=0",
      "sec-ch-ua":
        '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
  });
}

function login(cookie, url, username, password) {
  return fetch(`${url}/auth/login`, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      cookie: `${cookie}; tarteaucitron=!analytics=wait`,
      Referer: `${url}/abonne/prets`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `username=${username}&password=${password}&redirect=https%3A%2F%2Fbibliotheques.le-gresivaudan.fr%2Fabonne%2Fprets`,
    method: "POST",
  });
}

async function prets(cookie, url) {
  return fetch(`${url}/abonne/prets`, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "max-age=0",
      "sec-ch-ua":
        '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      cookie: `${cookie}; tarteaucitron=!analytics=wait`,
      Referer: `${url}/abonne/prets`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: null,
    method: "GET",
  });
}

function parseCookies(response) {
  return response.headers.get("set-cookie").split(";")[0];
}

const extractData = (rawHTML) => {
  let headers = [];
  const $ = Cheerio.load(rawHTML);
  $("table.loans thead tr th").each((i, th) =>
    headers.push($(th).text().trim().toLowerCase().replace(/ /gi, "_"))
  );
  headers = headers.map((header) =>
    header === "vignette"
      ? "cover"
      : header === "retour_prévu"
      ? "date"
      : header === "bibliothèque"
      ? "library"
      : header === "titre"
      ? "title"
      : header === "emprunté_par"
      ? "borrower"
      : header
  );
  // go through cells
  const data = [];
  const BLANK_IMG_URL =
    "http://www.identdentistry.ca/identfiles/no_image_available.png";
  $("table.loans tbody tr").each((_, tr) => {
    const rowData = {};
    $(tr)
      .find("td")
      .each((i, td) => {
        if (headers[i] === "cover") {
          let imgSrc = $(td).find("img").attr("src");
          if (imgSrc.indexOf("/blank.gif") > 0) {
            imgSrc = BLANK_IMG_URL;
          }
          rowData[headers[i]] = imgSrc;
        } else {
          rowData[headers[i]] = $(td).text();
        }
      });
    data.push(rowData);
  });
  return data.map((r) => {
    const m = r.date.match(/(\d*)\/(\d*)\/(\d*)/);
    r.date = new Date(m[2] + "/" + m[1] + "/" + m[3]);
    return {
      title: r.title,
      coverUrl: r.cover,
      date: r.date,
    };
  });
};

const collectData = async (credential) => {
  // HTTP Requests
  const blankRequest = await pretsNotLoggedIn(credential.url);
  const cookie = parseCookies(blankRequest);
  await login(cookie, credential.url, credential.username, credential.password);
  const response = await prets(cookie, credential.url);
  const rawHTML = await response.text();
  // End HTTP Requests

  const extractedData = extractData(rawHTML);

  if (!extractedData) {
    throw "Parsing failed? No result found.";
  }

  const today = new Date();
  const loans = extractedData
    .map((book) => ({
      title: book.title,
      coverUrl: book.coverUrl,
      days: dateDiffInDays(today, new Date(book.date)),
    }))
    .sort((a, b) => a.days - b.days);

  return Promise.resolve({
    remainingDays: loans[0].days,
    loans,
    name: credential.name,
    count: extractedData.length,
  });
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

const cacheSave = (memjsClient) => (data) => {
  memjsClient.set("loans", JSON.stringify(data), { expires: 60 * 60 * 24 });
  return data;
};
const sortBy = (field) => (data) => data.sort((a, b) => a[field] - b[field]);

export default class DataFetcher {
  constructor(memjsClient, credentials) {
    this.memjsClient = memjsClient;
    this.credentials = credentials;
  }

  run() {
    const promises = this.credentials.map(collectData);
    return Promise.all(promises)
      .then(sortBy("remainingDays"))
      .then(injectLastRun)
      .then(cacheSave(this.memjsClient));
  }
}

