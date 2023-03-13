import drpc from 'discord-rpc';
import Keybind from './Keybind.mjs';

class RPC extends Keybind {
    rpc;
    appID;
    scopes;
    constructor(appid, scopes = ['rpc', 'rpc.activities.write']) {
        super();
        this.appID = appid;
        this.scopes = scopes;
    }

    async init(handler) {
        this.rpc = new drpc.Client({
            transport: 'ipc'
        });
        await new Promise(r => {
            this.rpc.on('ready', r);
            this.rpc.login({
                clientId: this.appID,
                scopes: this.scopes
            });
        });
        console.error(`RPC Name: ${this.getRPCName()}\nRPC User: ${this.getRPCUser()}`);
        await super.init(handler);
    }

    getRPCName() {
        return this.rpc.application.name;
    }
    getRPCUser() {
        return this.rpc.user.username;
    }

    updateRPC(state, details) {
        this.rpc.setActivity({
            state: state,
            details: details,
            startTimestamp: new Date(),
            largeImageKey: 'logo',
            smallImageKey: 'logo',
            instance: false
        });
    }

    static getAppID() {
        // For Pandora-Term ONLY
        return '1084318125329219688';
    }
}

export default RPC;