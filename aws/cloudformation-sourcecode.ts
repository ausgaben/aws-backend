import { AusgabenSourceCodeApp } from './app/sourcecode'
;(async () => {
	new AusgabenSourceCodeApp().synth()
})().catch((err) => {
	console.error(err.message)
	process.exit(1)
})
