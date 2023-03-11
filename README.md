# bibliotheque

This script logs in to https://www.meylan-bibliotheque.fr or https://bibliotheques.le-gresivaudan.fr/ and sends reminders (by e-mail) about loans return date.

## `yarn start:rest`

Launches a web server and offers `/loans` API end-point, to expose fetched loans data. The data either comes from a cache or is freshly fetched by `data-fecher.js`.

## `script.js`

Reads data from the cache or calls `data-fecher.js`, and send e-mail notifications (using `notifier.js`) if some loans are about expire.
Typically usefull as a scheduled job (eg: every day).

## `worker.js`

Doesn't read the cache. Simply call `data-fecher.js` to refresh the cache.
Typically usefull as a scheduled job (eg: every hours).
