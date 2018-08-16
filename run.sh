#!/bin/bash
export BIBLIO_USERNAME='0052537'
export BIBLIO_PASSWORD='2012'
export BIBLIO_EMAILS='antoine.rosenbach@gmail.com:johanna.rosennbach@gmail.com'


path=`dirname $0`
#debug=--debug=true
debug=
casperjs $debug ${path}/data-fetcher.js 
