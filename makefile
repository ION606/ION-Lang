run:
	tsc
	node --trace-uncaught compiledJS/main.js run test/start.ion
	
loop:
	tsc
	node --trace-uncaught compiledJS/main.js run test/loop.ion

conditional:
	tsc
	node --trace-uncaught compiledJS/main.js run test/conditional.ion

error:
	tsc
	node --trace-uncaught compiledJS/main.js run test/try_catch_throw.ion

install:
	tsc
	node --trace-uncaught compiledJS/main.js i fetch
	
bundle:
	tsc
	node --trace-uncaught compiledJS/main.js bundle test/test.ion