import { Expression, createExpression } from "./Expression.js";
import { FunctionCall, customFunction } from "./Function.js";
import { parser, readAndParse } from "../parser.js";
import { findVarInd } from "./helpers.js";
import fs from 'fs';
import path from "path";
import { customThrow } from "./try_catch_throw.js";
import { customFetch } from "./async.js";
import { forkProcess } from "./fork.js";

export class Include {
    //@ts-ignore
    readContext: customTypes[];
    p: string;

    constructor(target: string, context: customTypes[], caller?: string, baseDir?: string) {
        const fname = target.replaceAll('"', '').replaceAll("'", '');

        if (fname.replace(/^.*[\\/]/, '') === caller?.replace(/^.*[\\/]/, '')) {
            throw `CYCLIC DEPENDANCY DETECTED BETWEEN "${fname}" AND "${caller}"\n(maybe check your include statements?)`;
        }

        let p = path.resolve(baseDir || '.', fname);
        if (!fs.existsSync(p)) {
            // try to find a module with that name
            const fnames = fs.readdirSync('ion_modules');
            const modName = fnames.find(n => (n === fname));
            if (!modName) throw `MODULE "${modName}" NOT FOUND!`;

            const modFolder = path.resolve(process.cwd(), 'ion_modules', modName),
                modEntryPoint = JSON.parse(fs.readFileSync(path.resolve(modFolder, 'bundleinfo.json')).toString()).entryPoint;
            p = path.resolve(modFolder, modEntryPoint);
        }

        this.p = p;
    }
}

export async function createInclude(target: string, context: customTypes[], caller?: string, baseDir?: string) {
    const inc = new Include(target, context, caller, baseDir);
    inc.readContext = await readAndParse(inc.p, caller);
    return inc;
}


export class customVar {
    name?: string;
    val?: Expression;
    type: string;
    #valPromise: Promise<Expression>

    async finishConv() {
        this.val = await this.#valPromise;
        return this;
    }

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
        this.#valPromise = createExpression(strsplit[1], context, parser);
        // }
    }
}

export async function createVar(inps: string[], context: customTypes[], key: string | undefined = 'let') {
    const v = new customVar(inps, context, key);
    return await v.finishConv();
}

export class customBoolean {
    val?: boolean;
    constructor(val: boolean) { this.val = val; }
}

export interface parserType {
    (dataRaw: string, context: customTypes[]): Promise<customTypes[]>
}


export type customTypes = Include | customVar | customFunction | FunctionCall | Expression | customBoolean | customThrow | customFetch | forkProcess;
export const customClasses = [Include, customVar, customFunction, FunctionCall, Expression, customBoolean, customThrow, customFetch, forkProcess];
export type customExpressionTypes = customVar | Expression;

export const isCustomVar = (obj: any): obj is customVar => obj instanceof customVar;
export const isExpression = (obj: any): obj is Expression => obj instanceof Expression;

export function isCustomExpressionTypes(obj: any): obj is customExpressionTypes {
    return isCustomVar(obj) || isExpression(obj);
}
