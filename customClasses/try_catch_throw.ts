import { Expression } from "./Expression.js";
import { customTypes, customVar, isCustomVar, parserType } from "./classes.js";
import { findVarInd } from "./helpers.js";

/**
 * @warn NOT IMPLEMENTED
 */
class try_catch_throw {
    constructor(inps: string[], context: customTypes[]) {
        
    }
}


export class customThrow {
    errstr:string;

    constructor(inps: string[], context: customTypes[]) {
        this.errstr = inps.map(i => {
            const ind = findVarInd(context, i);
            if (ind === -1) return i;
            else {
                const v = context[ind] as customVar | Expression;

                console.error(context, ind, isCustomVar(v))
                return (isCustomVar(v) ? v.val?.val : v.val);
            }
        }).join(" ");
    }
}