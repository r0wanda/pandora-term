import ch from 'chalk';
import inq from 'inquirer';
import Input from 'input-event';
import { readdirSync as rds } from 'node:fs';
import { fromCode as keys } from 'linux-keycodes';
import XWininfo from './XWininfo.mjs';

class BasicKbd extends XWininfo {
    kbd;
    kbdPath;
    constructor() {
        super();
        this.kbd = false;
        this.kbdPath = false;
    }
    async init() {
        if (!this.config.kbd) {
            await this.selectKbd();
        } else {
            this.kbdPath = this.config.kbd;
            this.event = new Input(this.kbdPath);
            this.kbd = new Input.Keyboard(this.event);
        }
    }
    listDevs(all, trim) {
        var oDevs = rds('/dev/input/by-id');
        oDevs = [...new Set(oDevs)];
        var devs = [...oDevs];
        if (!all) oDevs = devs = devs.filter(d => d.includes('-kbd'));
        if (trim) devs = devs.map(d => d.replace(/usb-|event-/g, '').replace(/-kbd/g, '').replace(/_/g, ' '));
        return [oDevs, devs];
    }
    async selectKbd(all = false, trim = true) {
        const devs = this.listDevs(all, trim);
        const choice = await inq.prompt([
            {
                type: 'list',
                name: 'kbd',
                message: 'Select your keyboard (if unsure pick the first one)',
                choices: [
                    ...devs[1],
                    'Show full names',
                    'Show non-keyboards'
                ]
            }
        ]);
        var orig;
        switch (choice.kbd) {
            case 'Show full names':
                await this.selectKbd(all, false);
                break;
            case 'Show non-keyboards':
                await this.selectKbd(true, trim);
                break;
            default:
                orig = `/dev/input/by-id/${devs[0][devs[1].indexOf(choice.kbd)]}`
        }
        this.kbdPath = orig;
        await this.initKbd();
    }
    async initKbd() {
        this.event = new Input(this.kbdPath);
        this.kbd = new Input.Keyboard(this.event);
        await new Promise(r => {
            console.log(ch.cyan('Press the space bar on selected keyboard'));
            function handle(ev) {
                const key = keys(ev.code);
                console.log(key);
                if (key === 'KEY_SPACE') r();
            }
            this.kbd.on('keypress', handle);
            this.kbd.on('keydown', handle);
        });
        this.kbd.removeAllListeners();
        console.log(ch.green('Keyboard confirmed!'));
        await this.edit('kbd', this.kbdPath);
        console.log(ch.cyan('Keyboard saved, change by tunning with --reset-kbd'));
    }
}

export default BasicKbd;