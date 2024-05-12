import { customTypes, customVar } from "./classes.js";

export const remQuotes = (s: string) => {
    return s.replace(/\\n|[^\\]\n/g, (match) => {
        if (match === '\\n') return match;
        return match[0];
    });
}



export function filterByVar(o: customVar | customTypes): o is customVar {
    return (o instanceof customVar);
}

export const findVarInd = (context: customTypes[], inpstr: string): number => context.findIndex(o => (filterByVar(o) && o.name === inpstr));

function sortInstructions(context: customTypes[]) {

}