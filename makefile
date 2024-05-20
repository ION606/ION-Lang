run:
	tsc
	node --trace-uncaught compiledJS/main.js test/start.ion
	
loop:
	tsc
	node --trace-uncaught compiledJS/main.js test/loop.ion

conditional:
	tsc
	node --trace-uncaught compiledJS/main.js test/conditional.ion

error:
	tsc
	node --trace-uncaught compiledJS/main.js test/try_catch_throw.ion