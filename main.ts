#!/usr/bin/env node

import { handleInstArgs } from "./handleInstArgs.js";
import { readAndParse } from "./parser.js";
import { bundlePackage, installPackage } from './utils/package_install.js'

function main() {
    if (process.argv.length < 4) throw "INSUFFICIENT ARGUMENTS!";
    const instArgs = process.argv.filter(a => a.startsWith('--'));
    if (instArgs.length) handleInstArgs(instArgs);

    const [, , command, fname] = process.argv;
    let r;
    
    if (command === 'run') r = readAndParse(fname);
    else if (command === 'install' || command === 'i') r = installPackage(process.argv.slice(3));
    else if (command === 'bundle') r = bundlePackage(process.argv[3]);
    else throw `UNKNOWN COMMAND "${command}"!`;

    if (process.env.ionlogtooutp) r.then(o => console.log(JSON.stringify(o)));
}

main();