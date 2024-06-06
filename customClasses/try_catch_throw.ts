import { Expression } from "./Expression.js";
import { customFunction } from "./Function.js";
import { customTypes, customVar, isCustomVar, parserType } from "./classes.js";
import { findVarInd } from "./helpers.js";
import { customClass } from "./obj.js";

export async function try_catch_throw(words: string[], context: customTypes[], parser: parserType) {
    // parse in the "try/catch" format
    const tryBody = words[0].substring(words[0].indexOf("{") + 1, words[0].length - 2)
        .split(";").filter(o => o).map(o => o.trim()).join(";") + ';';

    const catchBody = words[1].substring(words[0].indexOf("{") + 1, words[0].length - 2)
        .split(";").filter(o => o).map(o => o.trim()).join(";") + ';';

    try {
        return await parser(tryBody, context);
    }
    catch (err) {
        const fname = `err_${crypto.randomUUID().replaceAll('-', '')}`;
        context.push(new customFunction(`${fname}${catchBody}`, context, parser));
        return await parser(`${fname}(${err});`, context);
    }
}


export class customThrow {
    errstr: string;

    constructor(inps: string[], context: customTypes[]) {
        this.errstr = inps.map(i => {
            const ind = findVarInd(context, i);
            if (ind === -1) return i;
            else {
                const v = context[ind] as customVar | Expression;
                if (isCustomVar(v)) {
                    return (v.val instanceof customClass) ? JSON.stringify(v.val) : v.val?.val;
                }
                else return v.val;
            }
        }).join(" ");
    }
}