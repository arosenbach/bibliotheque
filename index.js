const memjs = require('memjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const dataFetcher = require('./data-fetcher');

(async function (){

const numDays = 5;
const numDaysReminder = 1; // Reminder one day before the dead line
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
      from: dest[0],
      subject,
      html
    };
    return sgMail.send(msg).then(() => {
        console.info(`Message sent with subject "${subject}"`);
    }).catch(error => {
        console.error(error.toString());
    });
}

const sendReport = (books, when, reminder) => {
    const bookslen = books.length;
    if (bookslen > 0) {
        const msg = `
        <h2>Livre(s) à rendre:</h2>
        <table>
        ${books.map(book => `
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
        `).join('</tr>')}
        </table>
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
  timeout: 1,       // default: 0.5 (seconds)
  keepAlive: false, // default: false
})


const {value} = await mc.get('lastRun');
let lastRun = new Date(null); // 1/1/1970
if(value) {
    lastRun = new Date(value.toString('utf8'));
}
console.info(`Last run: ${lastRun.getDate()}/${lastRun.getMonth()+1}/${lastRun.getFullYear()}`);
// If last was today we do nothing...
if (dateDiffInDays(lastRun, TODAY) === 0){
    console.log('Already ran today, exiting...');
    process.exit(0);
}

//
console.info(`fetching data...`);
try {
	const results = await dataFetcher.run();

    if(!results){
       throw 'Parsing failed? No result found.';
    } 

    const books = results.map(book => ({
        title: book.title,
        coverUrl: book.coverUrl,
        days: dateDiffInDays(TODAY, new Date(book.date))
    }));

    console.info(`Found ${books.length} books`);
    const remaining = books.map(b => b.days).sort()[0];
    console.info(`${remaining} days remaining.`);

    const booksFirstAlert = books.filter(book => book.days === numDays);
    const booksFirstReminder = books.filter(book => book.days === numDaysReminder);
    const booksLastReminder = books.filter(book => book.days === 0);
        
    Promise.all([
	        sendReport(booksFirstAlert, `dans ${numDays} jours`),
	        sendReport(booksFirstReminder, 'demain', true),
	        sendReport(booksLastReminder,  'aujourd\'hui!', true)
        ]).then(async function quit() {
        	await mc.set('lastRun', TODAY.toString(), {expires: 60*60*24});
        	await mc.delete('errorCnt');
        	process.exit(0);
     });	    
} catch (e) {
	let errorCnt = (await mc.get('errorCnt')).value;
	errorCnt = errorCnt ? 
				parseInt(errorCnt.toString('utf8'),10):
				0;
	console.warn('ERROR! count: '+ errorCnt);
	console.error(e);
	errorCnt +=1;
	if(errorCnt == 10) {
		console.info('Sending report by email...');
		const subject = 'Problème avec le script bibliotheque';
		await sendMessage(subject, `${e.stack.replace(/[\u00A0-\u9999<>\&]/gim, i => '&#'+i.charCodeAt(0)+';').replace(/\n/g,'<br>').replace(/ /g,'&nbsp;')}`, dest[0]);
	}	
	Promise.all([
		mc.set('errorCnt', errorCnt.toString(), {expires: 60*60*24}),
		mc.delete('lastRun')
	]).then(() => process.exit(1));
}

})();
