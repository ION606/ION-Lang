import { customFetch } from "./customClasses/async.js";
import { input, wait } from "./customClasses/helpers.js";


export const ReservedKeys = ['const', 'let', 'var', 'internal', 'external', 'fun', 'ion', 'pinknodders', 'return', 'for', 'in', 'of', 'break', 'print', 'error', 'me'];
export const ReservedFunctions = {
    'print': (...inp: any) => console.log(...inp),
    'echo': (...inp: any) => console.log(...inp),
    'error': (...inp: any) => console.error(...inp),
    'fetch': (...inp: any) => new customFetch(inp),
    'fork': (..._: any) => null,
    'wait': (...inp: any) => wait(inp),
    'input': (...inp: any) => input(inp)
};

export const asyncFuncs = [
    'fetch',
    'wait',
    'input'
]

export const declairators = ['create', 'make', 'const', 'var', 'let', 'internal', 'external'];
export const pseudoFuncs = ['while', 'for', 'if', 'else', 'break'];
export const trycatchthrowKeys = ['try', 'catch', 'throw'];

// obsolete?
const openingCharacters = ['(', '[', '{'];
const closingCharacters = { '(': ')', '[': ']', '{': '}' };