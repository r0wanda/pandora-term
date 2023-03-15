import url from 'node:url';
import path from 'node:path';
import pgrep from 'find-process';
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
        if (!await this.#discordOpen()) return false;
        this.py = new PythonShell(path.join(this.dirname, 'python/RPC.py'));
        console.error('RPC: Python started');
        await this.#waitForMsg('ready');
        console.error('RPC: Python ready');
        this.py.send(this.appID);
        this.#waitForMsg('rpcconn');
        console.error('RPC: Connected');
        return true;
    }

    #waitForMsg(msg) {
        return new Promise(function(r, j) {
            this.py.on('message', m => {
                console.error(m);
                if (m === msg) r();
            });
        }.bind(this))
    }
    async #discordOpen() {
        try {
            const procs = await pgrep('name', 'Discord', true);
            return procs.length > 0;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async updateRPC(state, details, startAt = new Date(), endAt = new Date()) {
        if (!this.#discordOpen()) return;
        if (!this.py) {
            await this.initRPC();
        }
        this.py.send(`set ${state} ${details}`);
        this.#waitForMsg('done');
        return true;
    }

    static getAppID() {
        // For Pandora-Term ONLY
        return '1084318125329219688';
    }
}

export default RPC;