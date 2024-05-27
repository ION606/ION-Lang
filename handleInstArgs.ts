import fs from 'fs';

function mirrorOutpToLogFile(fname?:string) {
    const cOld = console.log,
    eOld = console.error;

    const cPointer = fs.createWriteStream(fname || 'console.log'),
    ePointer = fs.createWriteStream(fname || 'error.log');

    console.log = (...inps) => {
        cPointer.write(JSON.stringify(inps));
        cOld(...inps);
    }
    
    console.error = (...inps) => {
        ePointer.write(JSON.stringify(inps));
        eOld(...inps);
    }
}


export function handleInstArgs(instArgs: string[]) {
    for (const arg of instArgs) {
        if (arg.startsWith('--trace')) mirrorOutpToLogFile(arg.replace('--trace', ''));
        if (arg === '--logoutp') process.env.ionlogtooutp = '1';
        if (arg === '--printchildstatus') process.env.PRINTCHILDSTATUS = '1';
    }
}
