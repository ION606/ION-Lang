import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import * as readline from 'readline';


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
            const fname = `.ioninstall/${packageName}.tgz`;
            await downloadFile(`https://github.com/The-ION-Language/modules/raw/main/${packageName}.tgz`, fname);
            console.info("done!");

            console.info('extracting package...');
            const folderName = path.join(process.cwd(), `ion_modules/${packageName}`)
            if (fs.existsSync(folderName)) fs.rmSync(folderName, { recursive: true });

            fs.mkdirSync(folderName, { recursive: true });
            await tar.x({ f: fname, C: `ion_modules/${packageName}` });

            console.info('cleaning up...');
            fs.rmSync(fname);

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
    const getStringInput = (prompt: string): Promise<String> => {
        return new Promise((resolve) => {
            rl.question(prompt, (input: string) => {
                resolve(input);
            });
        });
    };

    // replace with config file later
    const packageName = await getStringInput("enter package name: ");
    if (!packageName) throw "PACKAGE NAME NOT FOUND!";

    // const version = await axios.get(`https://github.com/The-ION-Language/modules/raw/main/${packageName}.tgz`).catch(() => null).then((res) => res?.data);

    fs.writeFileSync("bundleinfo.json", JSON.stringify({
        entryPoint,
        timeStamp: Date.now(),
        // add versioning system later?
    }));
    
    fnames.push('bundleinfo.json');

    if (fs.existsSync(`${packageName}.tgz`)) fs.rmSync(`${packageName}.tgz`);

    await tar.c(
        {
            gzip: true,
            file: `${packageName}.tgz`
        },
        fnames.map(f => {
            const NP = f.replace(process.cwd(), '');
            return path.isAbsolute(NP) ? NP.replace(process.cwd(), '').substring(1) : NP;
        })
    );

    fs.rmSync('bundleinfo.json');
    console.info("package compiled!\nPlease upload to https://ionlang.ion606.com/");
    process.exit(0);
}