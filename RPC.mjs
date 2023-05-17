import path from 'node:path';
import { PythonShell } from 'python-shell';
import Keybind from './Keybind.mjs';

class RPC extends Keybind {
    appID;
    scopes;
    py;
    constructor(appid) {
        super();
        this.appID = appid;
    }

    /**
     * Initializes Discord RPC
     * @returns {Promise<boolean>} Returns false if unsuccessful, else returns true
     */
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
        return await this.pgrep('Discord');
    }

    /**
     * Update status
     * @param {string} state 
     * @param {string} details 
     * @param {Date} startAt 
     * @param {Date} endAt 
     * @returns {Promise<boolean>} Returns false if unsuccessful, else returns true
     */
    async updateRPC(state, details, startAt = new Date(), endAt = new Date()) {
        if (!this.#discordOpen()) return;
        if (!this.py) {
            await this.initRPC();
        }
        this.py.send(`set ${state} ${details}`);
        this.#waitForMsg('done');
        return true;
    }

    /**
     * Get the Pandora-Term Application ID
     * @returns {string} The Pandora-Term Application ID
     */
    static getAppID() {
        // For Pandora-Term ONLY
        return '1084318125329219688';
    }
}

export default RPC;