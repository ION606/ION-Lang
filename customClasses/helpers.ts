import { baseAsync } from "./async.js";
import { customTypes, customVar } from "./classes.js";


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


export const findVarInd = (context: customTypes[], inpstr: string): number => context.findIndex(o => (filterByVar(o) && o.name === inpstr));


function sortInstructions(context: customTypes[]) {

}

export function loopToClosingBracket(splitBySC: string[], currentBlock: string, i: number) {
    let c = 0,
        line = splitBySC[i];

    while (line && line[c] != "}") {
        if (c > line.length) {
            currentBlock += line + ";";
            c = 0;
            i++;
            line = splitBySC[i];
        }
        else c++;
    }

    if (c > 0 && line) {
        // get partial line, make the rest into a new thing
        currentBlock += line.substring(0, c);
        const s = line.substring(c + 1);
        splitBySC.splice(i + 1, 0, (s.startsWith("}") ? s.substring(0) : s));
    }

    currentBlock += "}";
    return { line, currentBlock, i, splitBySC };
}


export function wait(...inp:any) {
    const ms = Number(inp[0]);
    if (Number.isNaN(ms)) throw `WAIT TIME IS NOT A VALID NUMBER (${inp[0]})`;
    return new baseAsync(new Promise((resolve) => setTimeout((resolve), ms)))
}