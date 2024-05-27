import path from "path";
import { customTypes } from "./classes.js";
import { spawn } from 'child_process';



export async function runFromFork(splitByScStr: string, contextStr: string, fname: string) {
    const customClasses = (await import('./classes.js')).customClasses;

    const contextRaw = JSON.parse(contextStr);

    const context = await forkProcess.deserializeContext(contextRaw);
    (await import('../parser.js')).parser(splitByScStr, context, { dirName: path.dirname(fname), fname });
}


export class forkProcess {
    async serializeContext(context: customTypes[]) {
        const customClasses = (await import('./classes.js')).customClasses;
        const toRet = [];

        for (const c of context) {
            if (typeof c !== 'object') toRet.push(c);
            else {
                //@ts-ignore
                c.className = customClasses.find(c2 => c instanceof c2)?.name;

                //@ts-ignore
                if (c.val) c.val = JSON.parse(await this.serializeContext([c.val]))[0];
            }
            toRet.push(c);
        }

        return JSON.stringify(toRet);
    }


    // this whole function is just a mess of //@ts-ignore
    static async deserializeContext(contextRaw: object[]): Promise<customTypes[]> {
        const customClasses = (await import('./classes.js')).customClasses;
        const toRet = [];

        if (typeof contextRaw !== 'object') return contextRaw;

        for (const c of contextRaw) {
            //@ts-ignore
            const classType = customClasses.find(c2 => (c2.name === c.className));
            if (!classType) toRet.push(c);
            else {
                //@ts-ignore
                const o = new classType([], [], null);

                for (const k in c) {
                    // @ts-ignore
                    if (k === 'val') o[k] = await forkProcess.deserializeContext([c[k]]);

                    //@ts-ignore
                    else o[k] = c[k];
                }

                toRet.push(o);
            }
        }

        return toRet;
    }

    constructor(inps: any[], context: customTypes[], splitByScStr: string) {
        this.serializeContext(context).then(cont => {
            const c = spawn('node', [process.argv[1], 'fork', splitByScStr, cont], {
                detached: true,
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            });

            c?.stdout?.on('data', (m) => console.log(m.toString()));
            c?.stderr?.on('data', (m) => console.error(m.toString()));
            
            if (process.env.PRINTCHILDSTATUS) {
                c?.on('spawn', () => console.info(`CHILD PROCESS ${c?.pid} SPAWNED`));
                c?.on('close', (eCode) => console.info(`CHILD PROCESS ${c?.pid} EXITED WITH CODE ${eCode}`));
                c?.on('disconnect', () => console.info(`CHILD PROCESS ${c?.pid} DISCONNECTED`));
                c?.on('error', (err) => console.error(`CHILD PROCESS ${c?.pid} HAS ERRED: ${JSON.stringify(err)}`));
            }
        });
    }
}