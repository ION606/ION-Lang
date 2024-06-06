import { handleConditional } from "../handleConditional.js";
import { createVar, customTypes, customVar, parserType } from "./classes.js";
import { findVarInd } from "./helpers.js";
import { customClass } from "./obj.js";


export function handleLoop(data: string, context: customTypes[], parser: parserType): any {
    let match = (/.*\(/).exec(data);
    if (!match) throw `INCORRECT FUNCTION "${data}"!`;

    if (match[0].trim().startsWith('for')) return CustomFor.runLoop(data, context, parser);
    else return CustomWhile.runLoop(data, context, parser);
}


export class CustomFor {
    static async runLoop(data: string, context: customTypes[], parser: parserType) {
        const conditional = data.match(/\(([^)]*)\)/)?.at(1);

        if (!conditional) throw `IMPROPERLY FORMATTED LOOP "${data}"`;

        // split the loop
        const [sCond, checkCond, incCond] = conditional.split(';').map(o => o.trim());

        // save the loop var
        let vInd = findVarInd(context, sCond.split(' ')[1]);
        if (vInd === -1) throw `LOOP ERROR: VARIABLE "${sCond.split(' ')[1]}" NOT FOUND!`;
        let v = context[vInd] as customVar;
        const vOld = v;

        // initialize the loop var
        context = await parser(sCond, context);
        vInd = findVarInd(context, sCond.split(' ')[1]);
        if (vInd === -1) throw `LOOP ERROR: VARIABLE "${sCond.split(' ')[1]}" NOT FOUND!`;
        v = context[vInd] as customVar;
        
        let runCond = await handleConditional(checkCond, context, parser);

        if (v.val instanceof customClass) throw "LOOP CONDITIONS WITH CUSTOM CLASS NOT SUPPORTED YET!";
        let i = v.val?.val;

        const fBody = data.substring(data.indexOf("{") + 1, data.length - 2).trim();

        while (runCond.val) {
            context = await parser(fBody, context);

            // loop stuff
            runCond = await handleConditional(checkCond, context, parser);
            vInd = findVarInd(context, sCond.split(' ')[1]);
            v = await createVar([incCond], context);
            context[vInd] = v;

            // @ts-ignore
            i = v.val?.val;
        }

        context[vInd] = vOld;
        return context;
    }
}



export class CustomWhile {
    static async runLoop(data: string, context: customTypes[], parser: parserType) {
        const conditional = data.match(/\(([^)]*)\)/)?.at(1);
        if (!conditional) throw `IMPROPERLY FORMATTED LOOP "${data}"`;

        // throw [conditional, handleConditional(conditional, context, parser), context];
        let runCond = await handleConditional(conditional, context, parser);
        while (runCond.val) {
            const fBody = data.substring(data.indexOf("{") + 1, data.length - 2).trim();
            context = await parser(fBody, context);

            runCond = await handleConditional(conditional, context, parser);
        }

        return context;
    }
}