import { callFunction, filterByFunction } from "./Function.js";
import { customTypes, customVar, isCustomExpressionTypes, parserType } from "./classes.js";
import { findVarInd, isObj } from "./helpers.js";
import { customClass } from "./obj.js";


function evalOperation(operandOne: number, operator: string, operandTwo: number) {
    switch (operator) {
        case '^':
            return operandOne ** operandTwo;

        case '*':
            return operandOne * operandTwo;

        case '/':
            return operandOne / operandTwo;

        case '+':
            return operandOne + operandTwo;

        case '-':
            return operandOne - operandTwo;

        default:
            throw `INVALID OPERATOR "${operator}"!`;
    }
}


function findNextPEMDASInd(str: string): { index: number, operator: string } {
    // Highest precedence first
    const precedence: { [key: string]: number } = {
        '^': str.indexOf('^'),
        '*': str.indexOf('*'),
        '/': str.indexOf('/'),
        '+': str.indexOf('+'),
        '-': str.indexOf('-')
    };

    // Find the first operation to perform based on precedence
    const operators = ['^', '*', '/', '+', '-']; // precedence from high to low
    for (let op of operators) {
        if (precedence[op] !== -1) {
            return { index: precedence[op], operator: op };
        }
    }

    return { index: -1, operator: '' };
}

function evalExpression(expStr: string, context: customTypes[]) {
    let nextOp = findNextPEMDASInd(expStr);
    while (nextOp.index !== -1) {
        expStr = processExpression(expStr, nextOp.index, nextOp.operator, context);

        if (expStr[0] === '-') {
            expStr = expStr.substring(1);
            nextOp = findNextPEMDASInd(expStr);
            expStr = '-' + expStr;
        }
        else nextOp = findNextPEMDASInd(expStr);
    }

    return parseFloat(expStr);
}

function processExpression(expStr: string, ind: number, operator: string, context: customTypes[]) {
    expStr = expStr.replaceAll(' ', '');

    // Find the operands around the operator
    const { operandsNew, operandsOld } = extractOperands(expStr, ind, operator, context),
        [operandOne, operandTwo] = operandsNew;

    // Evaluate the operation
    const result = evalOperation(operandOne, operator, operandTwo);

    // Replace the expression with the result
    const newStr = expStr.substring(0, ind - (operandsOld[0]?.toString()?.length || 0)) +
        result.toString() +
        expStr.substring(ind + operator.length + (operandsOld[1]?.toString()?.length || 0));

    return newStr;
}


function extractOperands(expStr: string, operatorIndex: number, operator: string, context: customTypes[]) {
    const leftPart = expStr.substring(0, operatorIndex);
    const rightPart = expStr.substring(operatorIndex + operator.length);

    /**
     * @throws if inpstr is null or not a var
     * @param inpstr 
     * @returns 
     */
    const checkAndFindVar = (inpstr?: string): string => {
        if (!inpstr) throw `UNKNOWN VAR FOR INPUT "${expStr}"`;

        if (Number.isNaN(Number(inpstr))) {
            // find var
            const vInd = findVarInd(context, inpstr);
            if (vInd === -1) throw `VARIABLE "${inpstr}" NOT FOUND!`;

            const v = context[vInd] as customVar;
            if (v.val instanceof customClass) return '';
            return v.val?.val || "";
        }
        else return inpstr;
    }

    const leftMatch = leftPart.match(/-?[a-zA-Z0-9]+(\.[0-9]+)?\s*$/);
    const rightMatch = rightPart.match(/-?[a-zA-Z0-9]+(\.[0-9]+)?/);

    const operandOne = leftMatch ? parseFloat(checkAndFindVar((leftMatch[0].trim()))) : 0;
    const operandTwo = rightMatch ? parseFloat(checkAndFindVar((rightMatch[0].trim()))) : 0;

    return { operandsNew: [operandOne, operandTwo], operandsOld: [leftMatch?.at(0)?.trim(), rightMatch?.at(0)?.trim()] };
}


/**
 * turns the expression into a tree and evaluates it (sort of)
 * @param {string} expStr
 * @returns number
 */
async function parseMathExpression(expStr: string, context: customTypes[], parser: parserType) {
    expStr = expStr.replaceAll(" ", '');

    const opBraceCount = expStr.length - expStr.replace("(", "").length, clsBraceCount = expStr.length - expStr.replace(")", "").length;
    if (opBraceCount !== clsBraceCount) throw `PARENTHESIS DO NOT MATCH IN ${expStr}!`;

    // const fRegex = /^[A-z].*\([^)]*\)/g;
    if ((/^[A-z].*\([^)]*\)/g).test(expStr)) {
        let fMatch;
        const fRegex = /\b\w+\([^)]*\)/g;

        // this is a method (AKA a FunctionCall)
        while ((fMatch = fRegex.exec(expStr)) !== null) {
            if (fMatch.index === fRegex.lastIndex) fRegex.lastIndex++;
            const fc = await callFunction(fMatch[0], context, parser)

            const v = (await fc.ret) as [customVar | Expression];

            if (fMatch[0]) {
                expStr = expStr.substring(0, fMatch.index) + v + expStr.substring(fMatch.index + fMatch[0].length);
                fRegex.lastIndex = 0;
            }
        }
    }

    // find anything between the parenthesis
    const regex = /\((?:[^)(]|\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))*\)/g;
    let match;

    if (regex.test(expStr)) {
        regex.lastIndex = 0;

        while ((match = regex.exec(expStr)) !== null) {
            // avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) regex.lastIndex++;

            const parsed = await parser(match[0].substring(match[0].indexOf('(') + 1, match[0].lastIndexOf(')')), context);

            if (isCustomExpressionTypes(parsed[0])) {
                expStr = expStr.substring(0, match.index) + parsed[0].val + expStr.substring(match.index + match[0].length);
                regex.lastIndex = 0;
            }
            else console.warn(`not a match "${JSON.stringify(parsed[0])}"`);
        }

        return evalExpression(expStr, context);
    }
    else {
        return evalExpression(expStr, context);
    }
}


export async function createExpression(expStr: string, context: customTypes[], parser: parserType): Promise<Expression> {
    const expr = new Expression(expStr, context, parser);

    if (!expStr) return expr;

    // deal with quotes
    if ((/^(['"])(?:(?!(?<=\\)\1).)*\1$/).test(expStr)) {
        expr.val = expStr.substring(1, expStr.length - 1);
        return expr;
    }

    const isMath = ['+', '-', '/', '*'].find(symb => expStr.includes(symb));

    if (isObj(expStr)) expr.val = JSON.parse(expStr);
    else if ((/^[A-z].*\((.|[\r\n])*\)$/).test(expStr)) {
        // this is a method (AKA a FunctionCall)
        expr.val = (await callFunction(expStr, context, parser)).ret;
    }
    else if (isMath) {
        expr.val = await parseMathExpression(expStr, context, parser);
    }
    else if ((/^[A-Za-z]([A-Za-z0-9]?)+$/).test(expStr)) {
        // this is most likely a variable
        const ind = findVarInd(context, expStr);
        if (ind === -1) throw `VARIABLE "${expStr}" NOT FOUND!`;

        // @ts-ignore CHANGE THIS LATER FFS
        expr.val = (context[ind] as customVar).val?.val;
    }
    else if (Array.isArray(expStr)) {
        expr.val = expStr.split(",").map(o => o.trim());
    }
    else if (!Number.isNaN(Number(expStr))) expr.val = Number(expStr);
    else if ((/^\{(.|\n|\r)*\}$/).test(expStr)) expr.val = JSON.parse(expStr);
    else expr.val = expStr; // throw `UNKNOWN ASSIGNEMENT TYPE FOR "${expStr}"!`;

    return expr;
}

export class Expression {
    val: any;

    constructor(expStr: string, context: customTypes[], parser: parserType) {

    }
}