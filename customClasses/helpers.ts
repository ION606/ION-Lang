import { baseAsync } from "./async.js";
import { customTypes, customVar } from "./classes.js";
import { customClass } from "./obj.js";


export const remQuotes = (s: string) => {
    return s.replace(/\\n|[^\\]\n/g, (match) => {
        if (match === '\\n') return match;
        return match[0];
    });
}


export function isObj(o: any) {
    try { return JSON.parse(o) }
    catch (err) { return false; }
}


export function filterByVar(o: customVar | customTypes): o is customVar {
    return (o instanceof customVar);
}

export function filterClass(o: customVar | customTypes): o is customClass {
    return (o instanceof customClass);
}


export const findVarInd = (context: customTypes[], inpstr: string): number => {
    let i = context.findIndex(o => (filterByVar(o) && o.name === inpstr))
    return (i !== -1) ? i : context.findIndex(o => filterClass(o) && o.cname === inpstr);
};


function sortInstructions(context: customTypes[]) {

}

export function loopToClosingBracket(splitBySC: string[], currentBlock: string, i: number, symb = '}') {
    let c = 0,
        line = splitBySC[i];
    const symbLength = symb.length;

    while (line && line.substring(c, c + symbLength) != symb) {
        if (c > line.length - symbLength) {
            currentBlock += line + ";";
            c = 0;
            i++;
            line = splitBySC[i];
        } else {
            c++;
        }
    }

    if (c > 0 && line) {
        // get partial line, make the rest into a new thing
        currentBlock += line.substring(0, c);
        const s = line.substring(c + symbLength);
        splitBySC.splice(i + 1, 0, (s.startsWith(symb) ? s.substring(symbLength) : s));
    }

    currentBlock += symb;
    return { line, currentBlock, i, splitBySC };
}



export function wait(...inp: any) {
    const ms = Number(inp[0]);
    if (Number.isNaN(ms)) throw `WAIT TIME IS NOT A VALID NUMBER (${inp[0]})`;
    return new baseAsync(new Promise((resolve) => setTimeout((resolve), ms)))
}