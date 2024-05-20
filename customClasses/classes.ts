import { Expression } from "./Expression.js";
import { FunctionCall, customFunction } from "./Function.js";
import { parser, readAndParse } from "../parser.js";
import { findVarInd } from "./helpers.js";
import fs from 'fs';
import path from "path";

export class Include {
    readContext: customTypes[];

    constructor(target: string, context: customTypes[], caller?: string, baseDir?: string) {
        const fname = target.replaceAll('"', '').replaceAll("'", '');

        if (fname.replace(/^.*[\\/]/, '') === caller?.replace(/^.*[\\/]/, '')) {
            throw `CYCLIC DEPENDANCY DETECTED BETWEEN "${fname}" AND "${caller}"\n(maybe check your include statements?)`;
        }

        // console.log(context);
        console.log(fname, caller);

        // read the target and dump the execution context
        if (!fs.existsSync(fname) && baseDir) {
            this.readContext = readAndParse(path.resolve(baseDir, fname), caller);
        }
        else {
            this.readContext = readAndParse(fname, caller);
        }
    }
}


export class customVar {
    name?: string;
    val?: Expression;
    type: string;

    constructor(inps: string[], context: customTypes[], key: string | undefined = 'let') {
        let j = inps.join("");
        this.type = key;

        // check if it's just "name = thing"; (breaks everything)
        // if ((/^[A-Za-z]+\=.*/).test(j)) {
        const regexIncrement = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\+/g;
        const regexCompound = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([+\-*/])=\s*(\d+(\.\d+)?)/g;

        // Replace function for i++
        const replacerIncrement = (_: any, variable: string) => {
            const vInd = findVarInd(context, variable);
            return `${variable}=${(context[vInd] as customVar).val?.val}+1`;
        };

        // Replace function for compound assignment operators
        const replacerCompound = (_: any, variable: string, operator: string, value: any) => {
            const vInd = findVarInd(context, variable);
            return `${variable}=${(context[vInd] as customVar).val?.val}${operator}${value}`;
        };

        // Replace all occurrences of i++
        j = j.replace(regexIncrement, replacerIncrement);

        // Replace all occurrences of compound assignment operators
        j = j.replace(regexCompound, replacerCompound);

        const strsplit = j.split('=');

        this.name = strsplit[0];
        this.val = new Expression(strsplit[1], context, parser);
        // }
    }
}

export class customBoolean {
    val?: boolean;
    constructor(val: boolean) { this.val = val; }
}

export interface parserType {
    (dataRaw: string, context: customTypes[]): customTypes[]
}


export type customTypes = Include | customVar | customFunction | FunctionCall | Expression | customBoolean;
export type customExpressionTypes = customVar | Expression;

export function isCustomVar(obj: any): obj is customVar {
    return obj && typeof obj.key === 'string' && 'value' in obj;
}

function isExpression(obj: any): obj is Expression {
    return obj instanceof Expression;
}

export function isCustomExpressionTypes(obj: any): obj is customExpressionTypes {
    return isCustomVar(obj) || isExpression(obj);
}
