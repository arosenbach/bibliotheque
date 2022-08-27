import fetch from 'node-fetch';
import * as Cheerio from 'cheerio';


async function pretsNotLoggedIn(){
    return fetch("https://bibliotheques.le-gresivaudan.fr/abonne/prets", {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "sec-gpc": "1",
          "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET"
      });
}

async function login(url,username,password) {
   return fetch("https://bibliotheques.le-gresivaudan.fr/auth/login", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      "cookie": "PHPSESSID=7ed781f4fd61bc530444bfa3c85e97be; tarteaucitron=!analytics=wait",
      "Referer": "https://bibliotheques.le-gresivaudan.fr/abonne/prets",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "username=L02136R249&password=1982&redirect=https%3A%2F%2Fbibliotheques.le-gresivaudan.fr%2Fabonne%2Fprets",
    "method": "POST"
  });
  }

async function prets(){
    return fetch("https://bibliotheques.le-gresivaudan.fr/abonne/prets", {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "sec-gpc": "1",
          "upgrade-insecure-requests": "1",
          "cookie": "PHPSESSID=7ed781f4fd61bc530444bfa3c85e97be; tarteaucitron=!analytics=wait",
          "Referer": "https://bibliotheques.le-gresivaudan.fr/abonne/prets",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
      });
}

function parseCookies(response) {
    return response.headers.get('set-cookie').split(';')[0];
}
  
// const loginResponse = await login("https://bibliotheques.le-gresivaudan.fr/auth/boite-login/id_profil/11/id_module/7",'L02136R249','1982');


// const notLoggedResponse = await pretsNotLoggedIn();
// let cookie = parseCookies(notLoggedResponse);
await login();
const pretsResponde = await prets();
console.log(await pretsResponde.text());
// console.log(cookie);
// cookie = "PHPSESSID=570dfeadefea4801ffa2021b8019202e";


// const loansResponse = await fetch("https://bibliotheques.le-gresivaudan.fr/abonne/prets", {
//     "headers": {
//       cookie,
//     },
//     "method": "GET"
//   });
// const loansResponseHTML = await loansResponse.text();



// const $ = Cheerio.load(loansResponseHTML)
// console.log($('table.loans').html());
// console.log(cookie);

// const loginResult = await fetch("https://bibliotheques.le-gresivaudan.fr/auth/boite-login/id_module/4", {
//     "body": "username=L02136R249&password=1982",
//     "method": "POST"
//     });
// const cookie = loginResult.headers.get('set-cookie');
// console.log(cookie);

// const opts = {
//     headers: {
//         cookie
//     },
//     credentials: 'include'
// };
// const result = await fetch(`https://bibliotheques.le-gresivaudan.fr/abonne/prets`, {method: 'POST', body: 'a=1'});

// const $ = Cheerio.load(await result.text())
// console.log($('table.loans').html());
