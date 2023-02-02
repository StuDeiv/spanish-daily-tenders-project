import { logInfo } from './log.js'
import { isLinkUpdated } from './utils.js'
import { scrapeAndSaveDB } from './utils.js'

isLinkUpdated() 
	? logInfo(`Tenders is up to date`)
	: scrapeAndSaveDB();