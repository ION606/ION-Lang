import fs from 'fs';
import { findVarInd, remQuotes } from "./customClasses/helpers.js";
import { Include, customVar, customTypes, isCustomExpressionTypes, isCustomVar } from './customClasses/classes.js';
import { Expression } from "./customClasses/Expression.js";
import { FunctionCall, customFunction } from "./customClasses/Function.js";

const openingCharacters = ['(', '[', '{'];
const closingCharacters = { '(': ')', '[': ']', '{': '}' };
const declairators = ['create', 'make', 'const', 'var'];


/**
 * @param {string} dataRaw
 * @param {any[]} context
 * @returns 
 */
export function parser(dataRaw: string, context: customTypes[]): customTypes[] {
    if ((/\{\s*\}/).test(dataRaw)) throw `EMPTY FUNCTIONS NOT ALLOWED!`;

    const splitBySC = dataRaw.split(";"),
        toRet = [];
    let contextFull: customTypes[] = context;

    for (let i = 0; i < splitBySC.length; i++) {
        const toExec: customTypes[] = [];

        let line = splitBySC[i],
            currentBlock = line + ";";

        const words = line.trim().split(" ").filter(o => o?.length),
            key = words.shift(),
            args = words.map(remQuotes);

        if (!key) continue;

        if (key === '#include') toExec.push(new Include(args[0]));
        else if (key === 'func') {
            // scan until you reach the end brace
            let c = 0;
            while (line[c] != "}") {
                if (c > line.length) {
                    c = 0;
                    i++
                    line = splitBySC[i];
                    currentBlock += line + ";";
                }
                else c++;
            }

            if (c > 0) {
                // get partial line, make the rest into a new thing
                currentBlock += line.substring(0, c);
                splitBySC.splice(i + 1, 0, line.substring(c + 1));
            }

            const funcStr = currentBlock.trim();
            toExec.push(new customFunction(funcStr, contextFull, parser));
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

            const cv = new customVar(newWords, contextFull);
            const cvInd = findVarInd(contextFull, cv.name || '');
            
            if (cvInd !== -1) {
                contextFull[cvInd] = cv;
            }
            else toExec.push(cv);
        }
        else if ((/^[A-Za-z]+\(/).test(key)) {
            const f = new FunctionCall(line, contextFull, parser);
            toExec.push(f.ret);
        }
        else if (key === 'return') {
            return [new Expression(args.join(' '), contextFull, parser).val];
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
                // this is a single operation (like math)
                return [new Expression(key, contextFull, parser)];
            }
        }

        contextFull = contextFull.concat(toExec);
    }

    return contextFull;
}


export const readAndParse = (fname: string) => {
    if (!fs.existsSync(fname)) throw `FILE "${fname}" NOT FOUND!\n(maybe you forgot to provide an absolute path?)`;
    return parser(fs.readFileSync(fname).toString(), []);
}