import { handleConditional } from "../handleConditional.js";
import { Expression } from "./Expression.js";
import { customTypes, customVar, parserType } from "./classes.js";
import { findVarInd } from "./helpers.js";


export function handleLoop(data: string, context: customTypes[], parser: parserType): any {
    let match = (/.*\(/).exec(data);
    if (!match) throw `INCORRECT FUNCTION "${data}"!`;

    if (match[0].trim().startsWith('for')) return new CustomFor(data, context, parser);  
}


export class CustomFor {
    constructor(data: string, context: customTypes[], parser: parserType) {
        const conditional = data.match(/\(([^)]*)\)/)?.at(1);

        if (!conditional) throw `IMPROPERLY FORMATTED LOOP "${data}"`;

        // split the loop
        const [sCond, checkCond, incCond] = conditional.split(';').map(o => o.trim());

        // initialize the loop var
        context = parser(sCond, context);
        let vInd = findVarInd(context, sCond.split(' ')[1]);
        if (vInd === -1) throw `LOOP ERROR: VARIABLE "${sCond.split(' ')[1]}" NOT FOUND!`;
        let v = context[vInd] as customVar;

        let runCond = handleConditional(checkCond, context, parser);
        let i = v.val?.val;

        const fBody = data.substring(data.indexOf("{") + 1, data.length - 2).trim();

        while (runCond.val) {            
            context = parser(fBody, context);

            // loop stuff
            runCond = handleConditional(checkCond, context, parser);
            vInd = findVarInd(context, sCond.split(' ')[1]);
            v = new customVar([incCond], context);
            context[vInd] = v;
            i = v.val?.val;
        }

        throw [sCond, checkCond, incCond];
    }
}



export class CustomWhile {
    constructor(data: string, context: customTypes[], parser: parserType) {
        console.log(data);
    }
}