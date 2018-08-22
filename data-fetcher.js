const puppeteer = require('puppeteer');



const screenshot = 'biblio.png';
const URL = 'https://www.meylan-bibliotheque.fr/abonne/prets';

async function openBrowser(){
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return {page, browser};
}

async function login(page, user, password) {
  await page.goto(URL);
  await page.type('#username', user);
  await page.type('#password', password);
  await page.$eval('form.login.form a', a => a.click());
}

// This is intended to be evaluated in page context
const extractData = () => {

	const tail = arr => arr.splice(1, arr.length);
    const BLANK_IMG_URL = 'http://www.identdentistry.ca/identfiles/no_image_available.png';

	function tableToJson(table) {
		const data = [];

		// first row needs to be headers
		let headers = [];
		for (let i = 0; i < table.rows[0].cells.length; i++) {
		    headers[i] = table.rows[0].cells[i].textContent.trim().toLowerCase().replace(/ /gi, '_');
		}
		headers = headers.map(function(h){
		    switch(h){
		    	case 'vignette': return 'cover';
		        case 'retour_prévu': return 'date';
		        case 'titre': return 'title';
		        default: return h;
		    }
		})

		// go through cells
		tail(Array.from(table.rows)).forEach(tableRow => {
 			const rowData = {};
 			Array.from(tableRow.cells).forEach((tableCell,j) =>  {
 				if(headers[j] === 'cover') {
                    let imgSrc = tableCell.querySelector('img').src;
                    if(imgSrc.indexOf('/blank.gif') > 0) {
                        imgSrc = BLANK_IMG_URL;
                    }
 					rowData[headers[j]] = imgSrc;
 				} else {
 					rowData[headers[j]] = tableCell.textContent;
 				}
 			});

		    data.push(rowData);

		});

		return data;
	}

	const data = tableToJson(document.querySelector('table.loans'));
	const result = data.map(r => {
	                const m = r.date.match(/(\d*)\/(\d*)\/(\d*)/);
	                r.date = new Date(m[2] + '/' + m[1] + '/' + m[3]);
	                return {
	                    title: r.title,
	                    coverUrl: r.cover,
	                    date: r.date
	                };
	});
	return JSON.stringify(result);
}

async function run(){
	const {page, browser} = await openBrowser();
	await login(page, process.env.BIBLIO_USERNAME, process.env.BIBLIO_PASSWORD);
	await page.waitForSelector('table.loans');
	// await page.screenshot({ path: screenshot });
	const data = JSON.parse(await page.evaluate(extractData));
	await browser.close();
    return data;
}

module.exports.run = run;
