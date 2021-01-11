import puppeteer from 'puppeteer';
import { dateDiffInDays } from './utils.js';



async function openBrowser(){
  const browser = await puppeteer.launch({
	   args: ['--no-sandbox', '--disable-setuid-sandbox']
	// ,headless: false // to debug locally, add `headless: false`
  }); 
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return {page, browser};
}

async function login(page, credential) {
  await page.goto(credential.url);
  await page.type('#username', credential.username);
  await page.type('#password', credential.password);
  await page.$eval('form.login.form a', a => a.click());
}

// This is intended to be evaluated in page context
const extractData = () => {

	const tail = arr => arr.splice(1, arr.length);
    const BLANK_IMG_URL = 'http://www.identdentistry.ca/identfiles/no_image_available.png';

	const tableToJson = table => {
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

const collectData = async (credential) => {
	const {page, browser} = await openBrowser();
	await login(page, credential);
	await page.waitForSelector('a.account-loans');
	await page.$eval('a.account-loans', a => a.click());
	await page.waitForSelector('table.loans');
	const data = JSON.parse(await page.evaluate(extractData));
	await browser.close();

    if(!data){
       throw 'Parsing failed? No result found.';
	} 
	
	const today = new Date();
	const loans = data.map(book => ({
		title: book.title,
		coverUrl: book.coverUrl,
		days: dateDiffInDays(today, new Date(book.date))
	})).sort((a,b) => a.days - b.days);
	
    return Promise.resolve( {
		remainingDays: loans[0].days,
		loans,
		name: credential.name,
		count: data.length
	});
};

function run(credentials){
	return  credentials.map(collectData);
}

export default { 
	run
};
