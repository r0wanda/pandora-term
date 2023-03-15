import url from 'node:url';
import path from 'node:path';
import { PythonShell } from 'python-shell';
import Keybind from './Keybind.mjs';

class RPC extends Keybind {
    appID;
    scopes;
    py;
    dirname;
    constructor(appid) {
        super();
        this.dirname = path.dirname(url.fileURLToPath(import.meta.url));
        this.appID = appid;
    }

    async init(handler) {
        await super.init(handler);
    }

    async initRPC() {
        this.py = new PythonShell(path.join(this.dirname, 'python/RPC.py'));
        console.error('RPC: Python started');
        await this.#waitForMsg('ready');
        console.error('RPC: Python ready');
        this.py.send(this.appID);
        this.#waitForMsg('rpcconn');
        console.error('RPC: Connected');
    }

    #waitForMsg(msg) {
        return new Promise(function(r, j) {
            this.py.on('message', m => {
                console.error(m);
                if (m === msg) r();
            });
        }.bind(this))
    }

    async updateRPC(state, details, startAt = new Date(), endAt = new Date()) {
        this.py.send(`set ${state} ${details}`);
        this.#waitForMsg('done');
    }

    static getAppID() {
        // For Pandora-Term ONLY
        return '1084318125329219688';
    }
}

export default RPC;