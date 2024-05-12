run:
	tsc
	node --trace-uncaught compiledJS/main.js test/start.ion