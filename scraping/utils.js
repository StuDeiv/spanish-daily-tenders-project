import * as xml2js from 'xml2js'
import { UPDATED_DATE } from '../db/index.js'
import { writeDBFile } from '../db/index.js'
import { logInfo, logSuccess, logError } from './log.js'
// Disable SSL certificate validation for development purposes
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const SCRAPING_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

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

let res = await fetch(SCRAPING_URL)
let body = await res.text()
const parser = new xml2js.Parser(parserOptions)
let result = await parser.parseStringPromise(body)

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

    let deletedTenders = []
    let updatedDate = '' 
    let nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href']

    //Get tenders of the main page
    let tenders = []
    tenders = tenders.concat(result['entry'])
    updatedDate = result['updated']
    result['at:deleted-entry'] === undefined ? null : deletedTenders = deletedTenders.concat(result['at:deleted-entry'])

    while(nextLink) {
        res = await fetch(nextLink)
        body = await res.text()
        result = await parser.parseStringPromise(body)
        result['at:deleted-entry'] === undefined ? null : deletedTenders = deletedTenders.concat(result['at:deleted-entry'])
        tenders = tenders.concat(result['entry'])
        nextLink = result['link'].filter((link) => link['rel'] === 'next')[0]['href']
        if(!nextLink.includes(getActualDate())) nextLink = null
    }
    return {tenders, deletedTenders, updatedDate}
}

export function isLinkUpdated(){
    let updatedDate = result['updated']
    return updatedDate === UPDATED_DATE
}

export async function scrapeAndSaveDB(){
    const start = performance.now()

    try {
    	logInfo(`Start scraping...`)
    	const { tenders, deletedTenders, updatedDate } = await getDailyTendersAndInfo()
    	logSuccess(`Scraped successfully`)

    	logInfo(`Writing [tenders] to database...`)
    	await writeDBFile('tenders', tenders)
    	logSuccess(`[tenders] written successfully`)

    	logInfo(`Writing [deleted-tenders] to database...`)
    	await writeDBFile('deleted-tenders', deletedTenders)
    	logSuccess(`[deletedTenders] written successfully`)

    	logInfo(`Writing [updated-date] to database...`)
    	await writeDBFile('updated-date', updatedDate)
    	logSuccess(`[updated-date] written successfully`)

    } catch (e) {
    	logError(`Error scraping`)
    	logError(e)
    } finally {
    	const end = performance.now()
    	const time = (end - start) / 1000
    	logInfo(`Scraped in ${time} seconds`)
    }
}
