var casper = require('casper').create({
    // clientScripts: [
    //     'lib/jquery.min.js',      // These two scripts will be injected in remote
    // ],
    pageSettings: {
        loadImages: false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    },
    logLevel: "debug",              // Only "info" level messages will be logged
    verbose: false                  // log messages will be printed out to the console
});
const system = require('system');
const username = system.env.BIBLIO_USERNAME;
const password = system.env.BIBLIO_PASSWORD;
var results;


casper
    .start('http://www.meylan-bibliotheque.fr/abonne/prets')
    .thenEvaluate(function (user, pass) {
        $('#username').val(user);
        $('#password').val(pass);
        $("#fieldset-login_form a:contains('Se connecter')").click();
    }, username, password)
    //.then(function() { console.log('ok'); casper.capture('sc.png');})
    .then(function () {
        results = this.evaluate(function () {

            function tableToJson(table) {
                var data = [];

                // first row needs to be headers
                var headers = [];
                for (var i = 0; i < table.rows[0].cells.length; i++) {
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
                for (var i = 1; i < table.rows.length; i++) {

                    var tableRow = table.rows[i];
                    var rowData = {};

                    for (var j = 0; j < tableRow.cells.length; j++) {

                        // rowData[headers[j]] = tableRow.cells[j].innerHTML;
                        rowData[headers[j]] = tableRow.cells[j].textContent;
                    }

                    data.push(rowData);
                }

                return data;
            }
            var data = tableToJson($('table.loans')[0]);
            var result = data.map(function (r) {
                            var m = r.date.match(/(\d*)\/(\d*)\/(\d*)/);
                            r.date = new Date(m[2] + '/' + m[1] + '/' + m[3]);
                            return {
                                title: r.title,
                                date: r.date
                            };
            });
            return result;
        })
    });

casper.run(function () {
    this.echo(JSON.stringify(results)).exit();
});