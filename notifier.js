import sgMail from "@sendgrid/mail";
import { checkEnv, debug } from "./utils.js";
import * as dotenv from "dotenv";
dotenv.config();

checkEnv(["SENDGRID_API_KEY"]);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const isDebug = process.env.BIBLIO_DEBUG === "1";

export default class Notifier {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  sendMessage(subject, html, to = this.to) {
    if (isDebug) {
      debug("Notifier.sendMessage called (DEBUG)", {
        subject,
        html,
        to,
      });
      return;
    }
    const msg = {
      to,
      from: this.from,
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
  }

  sendReport(libraryName, books, when, reminder) {
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
      return this.sendMessage(subject, msg, this.to);
    } else {
      return Promise.resolve();
    }
  }
}
