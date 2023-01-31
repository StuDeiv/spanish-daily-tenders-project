import * as xml2js from 'xml2js'
// Disable SSL certificate validation for development purposes
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

export const SCRAPING_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

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
}

const getActualDate = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()+1 < 10 
        ? `0${date.getMonth()+1}` 
        : date.getMonth()+1
    const day = date.getDate() < 10 
        ? `0${date.getDate()}`
        : date.getDate()
    return `${year}${month}${day}`
}

export async function getDailyTendersAndInfo(){
    let res = await fetch(SCRAPING_URL)
    let body = await res.text()
    const parser = new xml2js.Parser(parserOptions)

    let deletedTenders = []
    let updatedDate = '' 
    let result = await parser.parseStringPromise(body)
    let nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href']

    //Get tenders of the main page
    let tenders = []
    tenders.push(result['entry'])
    updatedDate = result['updated']
    result['at:deleted-entry'] === undefined ? null : deletedTenders.push(result['at:deleted-entry'])

    while(nextLink) {
        res = await fetch(nextLink)
        body = await res.text()
        result = await parser.parseStringPromise(body)
        result['at:deleted-entry'] === undefined ? null : deletedTenders.push(result['at:deleted-entry'])
        tenders.push(result['entry'])
        nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href']
        if(!nextLink.includes(getActualDate())) nextLink = null
    }
    return {tenders, deletedTenders, updatedDate}
}
