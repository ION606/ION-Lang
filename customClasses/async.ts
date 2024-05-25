import axios from "axios";


function isValidURL(u: string) {
    try { return new URL(u); }
    catch (err) { return false; }
}

export class customFetch {
    val: Promise<any>;

    constructor(...inpsRaw: string[]) {
        const inps = inpsRaw.flat(1);
        const u = inps.shift();

        const opts = (inps.length > 1) ? JSON.parse(inps.join(',').replace(/(\w+):/g, '"$1":').replace(/'/g, '"')) : undefined;

        if (!u) throw "URL NOT FOUND!";
        else if (!isValidURL(u)) throw `INVALID URL "${u}"`;

        this.val = axios.get(u, opts);
    }
}


export class customResponse {
    status: number;
    statusText: string;
    headers: Headers;
    body: any;
    url: string;
    method: string;

    async constructResponse(r: any) {
        for (const key in this) {
            if (key === 'body') this.body = r.data;
            else if (key === 'method') this.method = r.config.method;
            else if (key === 'url') this.url = r.config.url;
            else this[key] = r[key];
        }
        return this;
    }

    constructor() {
        this.status = -1;
        this.statusText = '';
        this.headers = new Headers();
        this.url = '';
        this.method = '';
        this.body = '';
    }
}