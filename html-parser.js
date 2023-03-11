import * as Cheerio from "cheerio";

const BLANK_IMG_URL =
  "http://www.identdentistry.ca/identfiles/no_image_available.png";

export default class HtmlParser {
  constructor(html) {
    this.html = html;
  }

  extractData() {
    const $ = Cheerio.default.load(this.html);

    let headers = [];
    $("table.loans thead tr th").each((_, th) =>
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
  }
}
