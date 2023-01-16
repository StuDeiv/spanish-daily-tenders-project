import * as xml2js from 'xml2js';

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


const getPreviousDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate()-1;
    const today = `${year}${month}${day}`;
    return today;
}

async function getTenders(parser,body) {
    let result = await parser.parseStringPromise(body);
    let nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href'];
    let tenders = [];
    while(nextLink) {
        let res = await fetch(nextLink);
        body = await res.text();
        result = await parser.parseStringPromise(body);
        nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href'];
        tenders.push(result['entry']);
        if(!nextLink.includes(getPreviousDate())) nextLink = null;
    }
    return tenders;
}

const totalTenders = await getTenders(parser,body);

//Pretty print JSON to console with colors and indentation 
console.log(JSON.stringify(totalTenders, null, 2));
