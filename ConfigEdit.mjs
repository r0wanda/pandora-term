import ch from 'chalk';
import inq from 'inquirer';
import open from 'open-editor';
import { readFileSync as rf } from 'node:fs';
import Vim from './Vim.mjs';
import Config from './Config.mjs';

class ConfigEdit extends Config {
    buf;
    config;
    constructor(config = false, lockFile = '/tmp/config-edit.pterm.lock') {
        super(lockFile);
        console.log(ch.green('Opening config editor'));
        this.config = config ? config : this.configPath;
    }
    async run() {
        await this.lock();
        this.initBuf();
        await this.initProg();
    }
    initBuf() {
        this.buf = JSON.parse(rf(this.config, 'utf8'));
    }
    async initProg() {
        console.log(ch.yellow('Choosing Vim is encouraged, the default editor does not always work'))
        const ed = await inq.prompt([
            {
                type: 'list',
                name: 'editor',
                message: 'Choose editor',
                choices: [
                    'Vim',
                    'Default'
                ]
            }
        ]);
        switch (ed.editor) {
            case 'Vim':
                const vim = new Vim();
                await vim.init();
                vim.start(this.config);
                await vim.waitForClose();
                break;
            default:
                open([this.config]);
        }
        this.unlock();
    }
}

export default ConfigEdit;
