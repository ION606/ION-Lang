import { Expression, createExpression } from "./Expression.js";
import { createVar, customTypes, customVar, parserType } from "./classes.js";
import { findVarInd as findVarInd } from "./helpers.js";
import { ReservedFunctions, ReservedKeys, asyncFuncs } from "../reservedKeys.js";
import { customFetch, customResponse } from "./async.js";
import { forkProcess } from "./fork.js";

export class customFunction {
    fname: string;
    fBody: string;
    context: customTypes[];
    params: string[]

    constructor(funcStr: string, context: customTypes[], parser: parserType) {
        const fHeader = funcStr.substring(0, funcStr.indexOf("{")).replace('func', '').trim();
        const pstart = fHeader.indexOf('(');

        this.fname = fHeader.substring(0, pstart);
        if (ReservedKeys.includes(this.fname)) throw `RESERVED KEYWORD "${this.fname}" USED!`;

        if (pstart + 1 >= fHeader.indexOf(')')) this.params = [];
        else this.params = fHeader.substring(pstart + 1, fHeader.indexOf(')'))?.split(",")?.map(p => p.trim());

        const fBody = funcStr.substring(funcStr.indexOf("{") + 1, funcStr.lastIndexOf("}")).trim();

        this.fBody = fBody;
        this.context = context;
    }
}

export function filterByFunction(o: customFunction | customTypes): o is customFunction {
    return o instanceof customFunction
}


export class FunctionCall {
    func: string;
    data: string[];
    ret: any;
    isAsync: boolean;

    /**
     * @param {*} data
     */
    constructor(data: any, context: customTypes[], parser: parserType) {
        this.func = data.split("(")[0].trim();
        this.data = data.split("(")[1].split(")")[0]?.split(',')?.map((o: string) => o?.trim());
        this.isAsync = asyncFuncs.includes(this.func);
    }
}


export async function callFunction(data: any, context: customTypes[], parser: parserType) {
    const funcObj = new FunctionCall(data, context, parser);

    // find the function
    if (funcObj.isAsync || Object.keys(ReservedFunctions).includes(funcObj.func)) {
        const f = ReservedFunctions[funcObj.func as keyof typeof ReservedFunctions];

        // convert variables
        const inp = await Promise.all(funcObj.data.map(async o => {
            if ((/^(['"]).*\1$/).test(o)) {
                const match = o.match(/^(['"])(.*)\1$/);
                if (match) return match[2];
                return o;
            }

            if (!Number.isNaN(Number(o))) return o;

            // we are trying to access a property
            if ((/^[\w]+\..*$/).test(o)) {
                const [vName, propName] = o.split('.');
                const ind = findVarInd(context, vName);
                if (ind === -1) throw `UNKNOWN VARIABLE "${vName}"`;

                const v = context[ind] as any;
                const vals = v.val?.val?.val || v.val?.val || v.val;

                if (!Object.keys(vals).includes(propName)) throw `PROPERTY "${propName}" NOT FOUND IN VARIABLE "${vName}"`;

                return vals[propName];
            }

            const ind = findVarInd(context, o);
            if (ind === -1) return (await createExpression(o, context, parser)).val;

            const v = context[ind] as customVar;
            return v.val?.val;
        }));

        if (funcObj.isAsync) {
            const r = new customResponse();
            const cVal = await (f(...inp) as customFetch).val;
            funcObj.ret = await r.constructResponse(cVal);
        }
        else funcObj.ret = f(...inp);

        return funcObj;
    }

    const f: customFunction | undefined = context.find(o => (filterByFunction(o) && o.fname === funcObj.func)) as customFunction | undefined;
    if (!f) throw `FUNCTION "${funcObj.func}" NOT FOUND!`;

    if (funcObj.data) {
        if (funcObj.data.length < f.params.length) throw `INSUFFICIENT FUNCTION ARGUMENTS FOR "${f.fname}"`;

        // overrite any variables
        for (const pInd in f.params) {
            const oldInd = findVarInd(context, f.params[pInd]),  // context.findIndex(o => ((o instanceof customVar) && o.name === f.params[pInd])),
                newVar = await createVar([f.params[pInd], '=', funcObj.data[pInd]], context);
            if (oldInd !== -1) {
                context[oldInd] = newVar;
            }
            else context.push(newVar);
        }
    }

    // call the function
    const res = await parser(f.fBody, context);
    funcObj.ret = res;

    return funcObj;
}