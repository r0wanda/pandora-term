import ch from 'chalk';
import inq from 'inquirer';
import open from 'open-editor';
import { readFileSync as rf, writeFileSync as wf, existsSync as ex, unlinkSync as df } from 'node:fs';
import Vim from './Vim.mjs';

class ConfigEdit {
    buf;
    config;
    lockFile;
    constructor(config = 'config.json', lockFile = '/tmp/config.pterm.lock') {
        console.log(ch.green('Opening config editor'));
        this.config = config;
        this.lockFile = lockFile;
    }
    async run() {
        await this.lock();
        this.initBuf();
        await this.initProg();
    }
    async lock() {
        if (ex(this.lockFile) && rf(this.lockFile, 'utf8') !== process.pid.toString()) {
            console.log(ch.red('Lockfile in use by other program'));
            console.log(ch.cyan('You may proceed if you\'re certain there are no other instances of the config editor running.'));
            console.log(ch.cyan('If there are other instances it may result in ') + ch.red('data loss.'));
            const ow = await inq.prompt([
                {
                    type: 'confirm',
                    name: 'configconfirm',
                    message: 'Overwrite lockfile?',
                    default: false
                }
            ]);
            if (!ow.configconfirm) {
                console.log(ch.red('Close all other instances before running again'));
                process.exit(1);
            }
        }
        wf(this.lockFile, process.pid.toString());
        console.log(ch.cyan(`Lockfile enabled at ${this.lockFile}`));
    }
    unlock() {
        df(this.lockFile);
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
                    'Default',
                    'Vim'
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
