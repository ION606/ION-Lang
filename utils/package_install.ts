import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import * as readline from 'readline';
import shell from 'shelljs';


const downloadFile = async (url: string, filePath: string) => {
    const writer = fs.createWriteStream(filePath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};


export async function installPackage(packageNames: string[]) {
    for (const packageName of packageNames) {
        try {
            if (!fs.existsSync('.ioninstall')) fs.mkdirSync('.ioninstall');

            console.info(`fetching package "${packageName}"...`);
            const rAPIURL = await axios.get(`https://api.github.com/repos/The-ION-Language/modules/contents/modules/${packageName}.json`)
                .then(d => JSON.parse(atob(d.data.content).toString()).repourl)
                .catch (_ => null);

            // desperately avoid making another api call
            const rURL = rAPIURL.replace('/contents/bundleinfo.json', '').replace('api.', '').replace('/repos', '') + '.git';

            console.info('cleaning up previous package...');
            const folderName = path.join(process.cwd(), `ion_modules/${packageName}`)
            if (fs.existsSync(folderName)) fs.rmSync(folderName, { recursive: true });
            fs.mkdirSync(folderName, { recursive: true });

            console.log(`fetching package...`);
            shell.cd(folderName);
            shell.exec(`git clone ${rURL}`);
            
            console.info("done!");
        }
        catch (err) {
            console.error(err);
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


export async function bundlePackage(entryPoint: string) {
    const fnames = getProcTree(entryPoint);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Function to get input from the user
    const getStringInput = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, (input: string) => {
                resolve(input);
            });
        });
    };

    // replace with config file later
    const packageName = await getStringInput("enter package name: ");
    if (!packageName) throw "PACKAGE NAME NOT FOUND!";

    fs.writeFileSync("bundleinfo.json", JSON.stringify({
        entryPoint,
        timeStamp: Date.now(),
        fnames,
        packageName
        // add versioning system later?
    }));

    fnames.push('bundleinfo.json');
    const newP = path.resolve(process.cwd(), 'ionbundle', packageName);
    if (fs.existsSync(newP)) fs.rmSync(newP, { recursive: true });

    await Promise.all(fnames.map(f => {
        return new Promise((resolve) => {
            const NP = f.replace(process.cwd(), '');
            const p = path.isAbsolute(NP) ? NP.replace(process.cwd(), '').substring(1) : NP;
            if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(p, { recursive: true });
            fs.cp(p, path.resolve(newP, NP), resolve);
        });
    }));

    console.info(`package compiled to ${newP}\n\nPlease upload to your github and submit to https://ionlang.ion606.com/`);
    process.exit(0);
}