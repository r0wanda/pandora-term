import url from 'node:url';
import path from 'node:path';
import format from 'json-format';
import { readFileSync as rf, writeFileSync as wf } from 'fs';
import Lock from './Lock.mjs';

class Config extends Lock {
    dirname;
    tips;
    help;
    config;
    constructor(lockFile = '/tmp/config.pterm.lock') {
        super(lockFile);
        this.dirname = path.dirname(url.fileURLToPath(import.meta.url));
        this.configPath = path.join(this.dirname, 'config.json');
        this.reset();
        this.tips = JSON.parse(rf(path.join(this.dirname, 'tips.json'))).tips;
        this.help = rf(path.join(this.dirname, 'help.txt'), 'utf8');
    }
    reset() {
        this.config = JSON.parse(rf(this.configPath));
    }
    async edit(key, val) {
        await this.lock(true);
        this.reset();
        this.config[key] = val;
        wf(this.configPath, format(this.config));
        this.unlock();
    }
}

export default Config;
