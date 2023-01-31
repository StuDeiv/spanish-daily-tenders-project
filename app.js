import * as xml2js from 'xml2js';
import fs from 'fs';
// Disable SSL certificate validation for development purposes
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const parserOptions = {
    attrkey: 'attr',
    charkey: 'text',
    explicitArray: false,
    explicitRoot: false,
    mergeAttrs: true,
    normalize: true,
    normalizeTags: true,
    trim: true,
    valueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans],
};

const res = await fetch('https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom');
const body = await res.text();
const parser = new xml2js.Parser(parserOptions);
let updateFileUpdate = '';

const getPreviousDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate()-1;
    const today = `${year}${month}${day}`;
    return today;
}

const getTenders = async (parser,body) => {
    let result = await parser.parseStringPromise(body);
    let nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href'];
    let tenders = [];
    while(nextLink) {
        let res = await fetch(nextLink);
        body = await res.text();
        result = await parser.parseStringPromise(body);
        updateFileUpdate = result['updated'];
        nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href'];
        tenders.push(result['entry']);
        if(!nextLink.includes(getPreviousDate())) nextLink = null;
    }
    return tenders;
}

const totalTenders = await getTenders(parser,body);

fs.writeFile(`./db/tenders-${updateFileUpdate}.json`, JSON.stringify(totalTenders), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});