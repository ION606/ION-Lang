import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import * as readline from 'readline';
import query_string from 'query-string';


export async function installPackage(packageNames: string[]) {
    for (const packageName of packageNames) {
        try {
            console.info(`fetching package "${packageName}"...`);
            const r = await axios.get(`https://raw.githubusercontent.com/The-ION-Language/modules/main/${packageName}.tgz`);
            console.info("done!");

            const fname = `.ioninstall/${packageName}.tzg`;
            fs.writeFileSync(fname, r.data);

            console.info('extracting package...');
            await tar.x({ f: fname, C: `ion_modules/${packageName}` });

            console.info('cleaning up...');
            fs.rmSync(fname);
            
            console.info("done!");
        }
        catch (err) {
            console.error(`UNABLE TO GET MODULE "${packageName}"`);
        }
    }
}


function getProcTree(entryPoint: string, p?: string): string[] {
    const d = (p) ? p : path.dirname(entryPoint);
    if (p) entryPoint = path.resolve(d, entryPoint);

    const includes = fs.readFileSync(entryPoint)
        .toString()
        .split(';')
        .filter(o => o && o.startsWith("#include"))
        .map(o => (o.replace("#include", '')
            .trim()
            .replaceAll('"', '')
            .replaceAll("'", '')));

    if (!includes.length) return [entryPoint];
    return [entryPoint].concat(includes.flatMap((e) => getProcTree(e, d)));
}


export async function bundlePackage(packageName: string, entryPoint: string) {
    const fnames = getProcTree(entryPoint);
    if (fs.existsSync('ionbundle.tgz')) fs.rmSync('ionbundle.tgz');
    if (fs.existsSync('ioninfo.json')) fs.rmSync('ioninfo.json');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Function to get input from the user
    const getStringInput = (prompt: string): Promise<String> => {
        return new Promise((resolve) => {
            rl.question(prompt, (input: string) => {
                resolve(input);
            });
        });
    };

    await tar.c(
        {
            gzip: true,
            file: 'ionbundle.tgz'
        },
        fnames.map(f => {
            const NP = f.replace(process.cwd(), '');
            return path.isAbsolute(NP) ? NP.replace(process.cwd(), '').substring(1) : NP;
        })
    );

    console.info("package compiled!\nPlease upload to https://ion-language-website.onrender.com");
    process.exit(0);
}