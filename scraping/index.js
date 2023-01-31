import { logError, logInfo, logSuccess } from './log.js'
import { getDailyTendersAndInfo } from './utils.js'
import { writeDBFile } from '../db/index.js'

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