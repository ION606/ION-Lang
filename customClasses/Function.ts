import { Expression } from "./Expression.js";
import { customTypes, customVar, parserType } from "./classes.js";
import { findVarInd as findVarInd } from "./helpers.js";
import { ReservedFunctions, ReservedKeys } from "../reservedKeys.js";

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

    // call = () => this.fPointer(this.data);
    /**
     * @param {*} data
     */
    constructor(data: any, context: customTypes[], parser: parserType) {
        this.func = data.split("(")[0].trim();
        this.data = data.split("(")[1].split(")")[0]?.split(',')?.map((o: string) => o?.trim());

        // find the function
        const f: customFunction | undefined = context.find(o => (filterByFunction(o) && o.fname === this.func)) as customFunction | undefined;
        if (Object.keys(ReservedFunctions).includes(this.func)) {
            const f = ReservedFunctions[this.func as keyof typeof ReservedFunctions];

            // convert variables
            const inp = this.data.map(o => {
                if ((/^(['"]).*\1$/).test(o)) {
                    const match = o.match(/^(['"])(.*)\1$/);
                    if (match) return match[2];
                    return o;
                }

                if (!Number.isNaN(Number(o))) return o;

                const ind = findVarInd(context, o);
                if (ind === -1) return new Expression(o, context, parser).val;

                const v = context[ind] as customVar;
                return v.val?.val;
            });

            this.ret = f(...inp);
            return this;
        }

        if (!f) throw `FUNCTION "${this.func}" NOT FOUND!`;

        if (this.data) {
            if (this.data.length < f.params.length) throw `INSUFFICIENT FUNCTION ARGUMENTS FOR "${f.fname}"`;

            // overrite any variables
            for (const pInd in f.params) {
                const oldInd = findVarInd(context, f.params[pInd]),  // context.findIndex(o => ((o instanceof customVar) && o.name === f.params[pInd])),
                    newVar = new customVar([f.params[pInd], '=', this.data[pInd]], context);
                if (oldInd !== -1) {
                    context[oldInd] = newVar;
                }
                else context.push(newVar);
            }
        }

        // call the function
        const res = parser(f.fBody, context);
        this.ret = res;
    }
}