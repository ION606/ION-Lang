import { Expression } from "./Expression.js";
import { FunctionCall, customFunction } from "./Function.js";
import { parser } from "../parser.js";

export class Include {
    target: string;

    constructor(target: string) {
        this.target = target.replaceAll('"', "");
    }
}


export class customVar {
    name?: string;
    val?: Expression;

    constructor(inps: string[], context: customTypes[]) {
        const j = inps.join("");
        // check if it's just "name = thing";
        if ((/^[A-Za-z]+\=.*/).test(j)) {
            const strsplit = j.split('=');
            this.name = strsplit[0];
            this.val = new Expression(strsplit[1], context, parser);
        }
    }
}

export interface parserType {
    (dataRaw: string, context: customTypes[]): customTypes[]
}


export type customTypes = Include | customVar | customFunction | FunctionCall | Expression
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
