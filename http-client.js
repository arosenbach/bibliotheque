import fetch from "node-fetch";



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

export default class HttpClient {

    constructor(credential){
        this.credential = credential;
    }

    async fetchLoans(){
        const blankRequest = await pretsNotLoggedIn(this.credential.url);
        const cookie = parseCookies(blankRequest);
        await login(cookie, this.credential.url, this.credential.username, this.credential.password);
        const response = await prets(cookie, this.credential.url);
        return response.text();
    }

    get libraryName(){
        return this.credential.name;
    }

}
