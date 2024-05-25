

export class customFetch {
    val: Promise<Response>;

    constructor(...inps: string[]) {
        const u = inps[0],
            opts = (inps.length > 1) ? JSON.parse(inps[1]) : undefined;
        this.val = fetch(u, opts)
    }
}