import { Expression } from "./Expression.js";
import { FunctionCall, callFunction, customFunction } from "./Function.js";
import { customFetch } from "./async.js";
import { Include, customBoolean, customTypes, customVar, isCustomExpressionTypes, isCustomFunction, parserType } from "./classes.js";
import { forkProcess } from "./fork.js";
import { findVarInd } from "./helpers.js";
import { customThrow } from "./try_catch_throw.js";



export class customClass {
    cname: string;
    customConstructor: customFunction;
    customVars: customTypes[];

    /**
     * @override the default print behaviour
     */
    // toString = () => { throw 12; }

    /**
     * runs the constructor with the given context
     * @modifies {this}
     * @param context 
     * @param constructorStr 
     * @returns 
     */
    async runConstructor(contextMain: customTypes[], constructorStr: string, parser: parserType): Promise<customClass> {
        const context = structuredClone(contextMain);
        const args = constructorStr.match(/\((.*)\)/)?.at(1)?.split(',');
        let params;

        if (args) {
            params = await Promise.all(this.customConstructor.params.map(async (aName, i) => {
                const v = new customVar([`${aName}=${args[i]}`], context);
                await v.finishConv();
                return v;
            }));

            context.push(...params);
        }

        context.push(...this.customVars);

        const bSplit = this.customConstructor.fBody.split(";").map(o => o?.trim()).filter(o => o);

        // handle all operations IN ORDER
        for (const o of bSplit) {
            if (o.startsWith('me')) {
                let [varName, varExp] = o.split('=');

                const varNameParsed = varName.replace('me.', '').trim();

                // if the var does not exist, throw
                const vInd = findVarInd(this.customVars, varNameParsed);
                if (vInd === -1) throw `CLASS VARIABLE "${varNameParsed}" NOT FOUND IN OBJECT ${this.cname}!`;

                // parse the stuff
                const tempVal = (await parser(`let ${crypto.randomUUID()}=${varExp}`, context))[0];
                if (tempVal instanceof customVar) tempVal.name = varName;
                this.customVars[vInd] = tempVal;
            }
            else {
                // replace the ".me" vars with other stuff
                let newStr = o;

                const matches = o.match(/me\.(\w+)/g);
                if (matches) {
                    for (const match of matches) {
                        let matchRep;
                        const vName = match.trim().split('.').at(1);

                        //@ts-ignore this will always be true because of the regex
                        const vInd = findVarInd(this.customVars, vName);
                        if (vInd === -1) throw `CLASS VARIABLE "${vName}" NOT FOUND IN OBJECT ${this.cname}!`;

                        const v = this.customVars[vInd];
                        if (isCustomFunction(v)) {
                            throw "CLASS VARIABLES MUST NOT BE METHODS (for now)";
                        }
                        else if (isCustomExpressionTypes(v)) {
                            if (v instanceof customFetch) matchRep = await v.val;
                            else if (v instanceof Expression) matchRep = v.val;
                            else matchRep = (v.val instanceof Expression) ? v.val.val : v.val;
                        }
                        else if (v instanceof FunctionCall) {
                            newStr = await v.ret;
                        }
                        else if (v instanceof customBoolean) newStr = String(v.val);
                        else if (v instanceof Include || v instanceof customThrow || v instanceof forkProcess) {
                            throw `INVALID TYPE DETECTED FOR CLASS VARIABLE "${vName}"`;
                        }
                        else {
                            // TODO: Implement arithmetic with classes later
                            throw `UNEXPECTED BEHAVIOUR TOWARDS CLASS "${v}"`;
                        }

                        newStr = newStr.replace(match, matchRep);
                    }

                    context.push(...await parser(newStr, context));
                }
                else context.push(...await parser(o, context));
            }
        }

        return this;
    }

    constructor(cname: string, constructorStr: customFunction, parser: parserType) {
        this.cname = cname;
        this.customConstructor = constructorStr;
        this.customVars = constructorStr.context;
    }
}


export async function createCustomClass(oStr: string, parser: parserType) {
    const [lhs, rhs] = oStr.split('!<').map(o => o.trim());

    const oName = lhs.match(/obj(\s)*(.*)([^\s])(\s*)/)?.at(2)?.trim();
    if (!oName) throw `NO NAME FOUND FOR OBJECT "${oStr}"`;

    const oBodyRaw = rhs.substring(0, rhs.length - 3),
        oBody = await parser(oBodyRaw, []),
        cInd = oBody.findIndex(o => isCustomFunction(o) && o.fname === oName);

    if (cInd === -1) throw `NO CONSTRUCTOR FOUND FOR CLASS OBJECT "${oName}"`;

    // perhaps use later?
    const constructor = oBody.splice(cInd)[0] as customFunction;

    return new customClass(oName, constructor, parser);
}