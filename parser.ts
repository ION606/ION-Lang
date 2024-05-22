import fs from 'fs';
import path from 'path';
import { findVarInd, loopToClosingBracket, remQuotes } from "./customClasses/helpers.js";
import { Include, customVar, customTypes } from './customClasses/classes.js';
import { Expression } from "./customClasses/Expression.js";
import { FunctionCall, customFunction } from "./customClasses/Function.js";
import { declairators, pseudoFuncs } from "./reservedKeys.js";
import { incSymbs, handleConditional } from './handleConditional.js';
import { handleLoop } from './customClasses/Loops.js';
import { customThrow, try_catch_throw } from './customClasses/try_catch_throw.js';


/**
 * @param {string} dataRaw
 * @param {any[]} context
 * @returns 
 */
export function parser(dataRaw: string, context: customTypes[], baseDir?: { dirName: string, fname?: string }): customTypes[] {
    if ((/\{\s*\}/).test(dataRaw)) throw `EMPTY FUNCTIONS NOT ALLOWED!`;

    let splitBySC = dataRaw.split(";").filter(o => o);
    let contextFull: customTypes[] = context;

    for (let i = 0; i < splitBySC.length; i++) {
        const toExec: customTypes[] = [];

        let line = splitBySC[i]?.trim(),
            currentBlock = "",
            words = line.trim().split(" ").filter(o => o?.length),
            key = words.shift()?.trim(),
            args = words.map(remQuotes);

        if (key?.startsWith("}")) {
            key = key.substring(key.indexOf("}") + 1);
            key = key.trim();
        }

        if (!key) continue;

        if (key === '#include') toExec.push(...(new Include(args[0], contextFull, baseDir?.fname, baseDir?.dirName)).readContext);
        else if (key === 'throw') throw (new customThrow(words, context)).errstr;
        else if (key === 'try') {
            let k2 = key.substring(0, key.indexOf("{"));
            const conditionalChain = [];

            // copied from "if/else", perhaps abstract to function
            while (k2.startsWith('catch') || !conditionalChain.length) {
                ({ line, currentBlock, i, splitBySC } = loopToClosingBracket(splitBySC, "", i));
                conditionalChain.push(currentBlock.trim());
                i++;
                line = splitBySC[i];
                k2 = line.trim().split(" ")[0];
            }
            i--;
            
            contextFull = try_catch_throw(conditionalChain, contextFull, parser);
        }
        else if (key.startsWith('if') || key.startsWith('else')) {
            // go until you reach the final condition
            let k2 = key.substring(0, key.indexOf("{"));
            const conditionalChain = [];

            // account for first if, else if's and else's
            while (k2.startsWith('else') || !conditionalChain.length) {
                ({ line, currentBlock, i, splitBySC } = loopToClosingBracket(splitBySC, "", i));
                conditionalChain.push(currentBlock.trim());

                // mimick the "for" loop
                i++;

                line = splitBySC[i];
                k2 = line.trim().split(" ")[0];
            }

            // otherwise the loop will skip the next thing
            i--;


            // check initial condition, then keep going through any "else's"
            for (const condFull of conditionalChain) {
                const conditional = condFull.match(/\(([^)]*)\)/)?.at(1);
                if (!conditional) throw `IMPROPERLY FORMATTED CONDITIONAL "${condFull}"`;

                if ((/^(else)\s*?\{/).test(condFull) || handleConditional(conditional, contextFull, parser).val) {
                    // add to execution order
                    const body = condFull.match(/\{[^\}]*/)?.at(0)?.substring(1);
                    if (!body) throw "EMPTY CONDITIONALS NOT ALLOWED!";

                    splitBySC.splice(i + 1, 0, body?.trim());
                    break;
                }
            }
        }
        else if (key === 'func' || pseudoFuncs.includes(key.split('(')[0])) {
            // removed (/^[A-Za-z]([\w]+)?\s?\(/).test(line) && because 

            // scan until you reach the end brace
            ({ line, currentBlock, i, splitBySC } = loopToClosingBracket(splitBySC, currentBlock, i));

            if (pseudoFuncs.includes(key) && ['while', 'for'].includes(key)) {
                contextFull = handleLoop(currentBlock.trim(), contextFull, parser);
            }
            else {
                const funcStr = currentBlock.trim();
                toExec.push(new customFunction(funcStr, contextFull, parser));
            }
        }
        else if ((/^[A-Za-z]([\w]+)?\s?\(/).test(line)) {
            const f = new FunctionCall(line, contextFull, parser);
            if (f.ret) toExec.push(f.ret);
        }
        else if (key === 'return') {
            return [new Expression(args.join(' '), contextFull, parser).val];
        }
        else if (incSymbs.find(s => key.includes(s))) {
            const symb = incSymbs.find(s => key.includes(s));
            if (!symb) throw 'what';

            const cvInd = findVarInd(contextFull, key.replace(symb, '').trim());
            if (cvInd == -1) throw `VARIABLE "${key}" NOT FOUND!`;

            const v = new customVar([key], contextFull, (contextFull[cvInd] as customVar).type);
            contextFull[cvInd] = v;
        }
        else if (declairators.includes(key)) {
            // check for a string
            const newWords = [];
            for (let i2 = 0; i2 < words.length; i2++) {
                const word = words[i2];

                if (word.startsWith('"')) {
                    let strs = [];
                    for (; i2 < words.length; i2++) {
                        strs.push(words[i2])
                        if (words[i2].endsWith('"') && !words[i2].endsWith('\\"')) break;
                    }
                    newWords.push(strs.join(' '));
                }
                else newWords.push(word);
            }

            const cv = new customVar(newWords, contextFull, key);
            const cvInd = findVarInd(contextFull, cv.name || '');

            if (cvInd !== -1) {
                contextFull[cvInd] = cv;
            }
            else toExec.push(cv);
        }
        else {
            // check for useless code
            if (key.startsWith('/*')) {
                // go until the comment is done
                let c = 0;
                while (!(line[c] === '*' && line[c + 1] === '/')) {
                    if (c > line.length) {
                        c = 0;
                        i++;
                        line = splitBySC[i];
                    }
                    else
                        c++;
                }
                if (c > 0) {
                    splitBySC.splice(i + 1, 0, line.substring(c + 2));
                }
            }
            else {
                if ((/^\w+\s?\=\s?.+/).test(line.trim())) {
                    // this is a re-assignement
                    const vName = key.split('=')[0];
                    const vInd = findVarInd(contextFull, vName);
                    if (vInd === -1) throw `UNKNOWN VARIABLE "${line.trim()}"!`;
                    const v = contextFull[vInd] as customVar;

                    if (v.type === 'const') throw `CAN NOT REDECLAIR CONST VAR "${vName}"!`;

                    // there has to be a better way
                    v.val = new Expression(words.join('').substring(1), contextFull, parser);
                }
                // this is a single operation (like math)
                else return [new Expression(key, contextFull, parser)];
            }
        }

        contextFull = contextFull.concat(toExec).filter(o => o);
    }

    return contextFull;
}


export const readAndParse = (fname: string, calledFrom?:string) => {
    if (!fs.existsSync(fname)) throw `FILE "${fname}" NOT FOUND!\n(maybe you forgot to provide an absolute path?)`;
    return parser(fs.readFileSync(fname).toString(), [], { fname: (calledFrom || fname), dirName: path.dirname(fname) });
}