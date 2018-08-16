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

	function tableToJson(table) {
		const data = [];

		// first row needs to be headers
		let headers = [];
		for (let i = 0; i < table.rows[0].cells.length; i++) {
		    headers[i] = table.rows[0].cells[i].textContent.trim().toLowerCase().replace(/ /gi, '_');
		}
		headers = headers.map(function(h){
		    switch(h){
		        case 'retour_prévu': return 'date';
		        case 'titre': return 'title';
		        default: return h;
		    }
		})
		//headers = ['owner', 'support', 'title', 'author', 'location', 'date', 'info'];

		// go through cells
		for (let i = 1; i < table.rows.length; i++) {

		    const tableRow = table.rows[i];
		    const rowData = {};

		    for (let j = 0; j < tableRow.cells.length; j++) {

		        // rowData[headers[j]] = tableRow.cells[j].innerHTML;
		        rowData[headers[j]] = tableRow.cells[j].textContent;
		    }

		    data.push(rowData);
		}

		return data;
	}

	const data = tableToJson(document.querySelector('table.loans'));
	const result = data.map(function (r) {
	                const m = r.date.match(/(\d*)\/(\d*)\/(\d*)/);
	                r.date = new Date(m[2] + '/' + m[1] + '/' + m[3]);
	                return {
	                    title: r.title,
	                    date: r.date
	                };
	});
	return result;
}

async function run(){
	const {page, browser} = await openBrowser();
	await login(page, process.env.BIBLIO_USERNAME, process.env.BIBLIO_PASSWORD);
	await page.waitForSelector('table.loans');
	// await page.screenshot({ path: screenshot });
	const data = await page.evaluate(extractData);
	console.dir(data);
	await browser.close();
}

run();
