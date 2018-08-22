const dataFetcher = require('./data-fetcher');
(async function(){
const r = await dataFetcher.run();
console.log(r);
console.log('xxx')
})();