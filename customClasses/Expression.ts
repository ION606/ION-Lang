import { customTypes, customVar, isCustomExpressionTypes, parserType } from "./classes.js";
import { findVarInd } from "./helpers.js";


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
function parseMathExpression(expStr: string, context: customTypes[], parser: parserType) {
    expStr = expStr.replaceAll(" ", '');

    const opBraceCount = expStr.length - expStr.replace("(", "").length, clsBraceCount = expStr.length - expStr.replace(")", "").length;
    if (opBraceCount !== clsBraceCount) throw `PARENTHESIS DO NOT MATCH IN ${expStr}!`;

    // find anything between the parenthesis
    const regex = /\((?:[^)(]|\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))*\)/g;
    let match;

    if (regex.test(expStr)) {
        while ((match = regex.exec(expStr)) !== null) {
            // avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) regex.lastIndex++;

            const parsed = parser(match[0].substring(match[0].indexOf('(') + 1, match[0].lastIndexOf(')')), context);

            if (isCustomExpressionTypes(parsed[0])) {
                expStr = expStr.substring(0, match.index) + parsed[0].val + expStr.substring(match.index + match[0].length);
                regex.lastIndex = 0;
            }
            else console.warn(`not a match "${parsed[0]}`);
        }

        return evalExpression(expStr, context);
    }
    else {
        return evalExpression(expStr, context);
    }
}


export class Expression {
    val: any;

    constructor(expStr: string, context: customTypes[], parser: parserType) {
        if (!expStr) return;

        // deal with quotes
        if ((/^(['"])(?:(?!(?<=\\)\1).)*\1$/).test(expStr)) {
            this.val = expStr.substring(1, expStr.length - 1);
            return this;
        }

        const isMath = ['+', '-', '/', '*'].find(symb => expStr.includes(symb));

        if (isMath) {
            this.val = parseMathExpression(expStr, context, parser);
        }
        else if ((/^[A-Za-z0-9]+$/).test(expStr)) {
            this.val = expStr;
        }
        else if (Array.isArray(expStr)) {
            this.val = expStr.split(",").map(o => o.trim());
        }

        else throw `UNKNOWN ASSIGNEMENT TYPE FOR "${expStr}"!`;
    }
}