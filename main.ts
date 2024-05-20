#!/usr/bin/env node

import { handleInstArgs } from "./handleInstArgs.js";
import { readAndParse } from "./parser.js";

function main() {
    if (process.argv.length < 3) throw "INSUFFICIENT ARGUMENTS!";
    const instArgs = process.argv.filter(a => a.startsWith('--'));
    if (instArgs.length) handleInstArgs(instArgs);
    
    const [, , fname] = process.argv;
    console.log("ret:", readAndParse(fname));
}

main();