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

network:
	tsc
	node --trace-uncaught compiledJS/main.js run test/networking.ion --logoutp

install:
	tsc
	node --trace-uncaught compiledJS/main.js i test

fork:
	tsc
	node --trace-uncaught compiledJS/main.js run test/fork.ion --printchildstatus
	
bundle:
	tsc
	node --trace-uncaught compiledJS/main.js bundle test/test.ion