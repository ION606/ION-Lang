run:
	tsc
	node --trace-uncaught compiledJS/main.js test/start.ion
	
loop:
	tsc
	node --trace-uncaught compiledJS/main.js test/loop.ion

conditional:
	tsc
	node --trace-uncaught compiledJS/main.js test/conditional.ion