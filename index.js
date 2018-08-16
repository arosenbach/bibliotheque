const exec = require('child_process').exec;
const memjs = require('memjs');
const sgMail = require('@sendgrid/mail');

(async function (){

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const numDays = 5;
const numDaysRappel = 1; // Rappel la veille
const dest = process.env.BIBLIO_EMAILS.split(':').map(s => s.trim());
const TODAY = new Date();



// a and b are javascript Date objects
const dateDiffInDays = (a, b) => {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

const sendMessage = (subject, html, to=dest) => {
    const msg = {
      to,
      from: 'bibliotheque@rbch.ovh',
      subject,
      html
    };
    return sgMail.send(msg).then(() => {
        console.log(`Message sent with subject "${subject}"`);
    }).catch(error => {
        console.error(error.toString());
    });
}

const sendReport = (books, when, reminder) => {
    const bookslen = books.length;
    if (bookslen > 0) {
        const msg = `
        <h2>Livre(s) à rendre:</h2>
        <ul>
        ${books.map(book => `
            <input type="checkbox" />
            <label>${book.title}</label>
        `).join('<br>')}
        </ul>
        `;
        const subject = `${reminder ? 'Rappel: ':''}${bookslen} livres à rendre pour ${when}`;
        return sendMessage(subject, msg);
    } else {
        return Promise.resolve();
    }
}


//
const mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
  failover: false,  // default: false
  timeout: 1,      // default: 0.5 (seconds)
  keepAlive: false,  // default: false
})





const {value} = await mc.get('lastRun');
let lastRun = new Date(null); // 1/1/1907
if(value) {
    lastRun = new Date(value.toString('utf8'));
}
console.log(`Last run: ${lastRun.getDate()}/${lastRun.getMonth()+1}/${lastRun.getFullYear()}`);
// If last was today we do nothing...
if (dateDiffInDays(lastRun, TODAY) === 0){
    console.log('Already ran today, exiting...');
    process.exit(0);
}

//
console.log(`executing casperjs ${__dirname }/data-fetcher.js`);
try {
	exec(`casperjs ${__dirname }/data-fetcher.js`, async function(err, stdout, stderrcode) {
	    const results = JSON.parse(stdout);
	    if(!results){
	       Promise.reject('Parsing failed.');
	    } 
	    Promise.reject(Error("oups"));

	    const books = results.map(book => ({
	        "title": book.title,
	        "days": dateDiffInDays(TODAY, new Date(book.date))
	    }));

	    console.log(`Found ${books.length} books`);

	    const booksFirstAlert = books.filter(book => book.days === numDays);
	    const booksFirstReminder = books.filter(book => book.days === numDaysRappel);
	    const booksLastReminder = books.filter(book => book.days === 0);
	        
	    Promise.all([
	        sendReport(booksFirstAlert, `dans ${numDays} jours`),
	        sendReport(booksFirstReminder, 'demain', true),
	        sendReport(booksLastReminder,  'aujourd\'hui!', true)
	        ]).then(async function quit() {
	        	await mc.set('lastRun', TODAY.toString(), {expires: 60*60*24}); 
	        	process.exit(0);
	        });	    
	});
} catch (e) {
	const subject = 'Problème avec le script pour le compte de la bibliotheque';
	let errorCnt = await mc.get('errorCnt');
	errorCnt +=1;
	// if(errorCnt > 10) {

	// }	
	Promise.all([
		sendMessage(subject, e+`<br>Error count: ${errorCnt}`, dest[0]),
		mc.set('errorCnt', errorCnt, {expires: 60*60*24}),
		mc.delete('lastRun')
	]).then(() => process.exit(1));
}

})();
