import ch from 'chalk';
import exists from 'command-exists-promise';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

/*
 * Automatically find and open one of NeoVim, Vim, or Vi, the hardest editors to close
 */

class Vim extends EventEmitter {
    vim;
    editor;
    constructor() {
        super();
        this.vim = null;
        this.editor = false;
    }
    async init() {
        const viExists = await exists('vi');
        const vimExists = await exists('vim');
        const nvimExists = await exists('nvim');
        if (nvimExists) {
            console.log(ch.cyan('Vim: Using NeoVim'));
            this.editor = 'nvim';
        } else if (vimExists) {
            console.log(ch.cyan('Vim: Using Vim'));
            this.editor = 'vim';
        } else if (viExists) {
            console.log(ch.yellow('Vim: Falling back onto Vi'));
            this.editor = 'vi';
        } else {
            throw new Error('Vim/NeoVim not found');
        }
    }
    start(file) {
        if (!this.editor) throw new Error('Editor not selected');
        this.vim = spawn(this.editor, [file], {
            stdio: 'inherit'
        });
        this.vim.on('close', code => {
            this.emit('close', code);
        });
    }
    quit() {
        if (this.vim === null) throw new Error('Vim not started');
        this.vim.kill();
    }
    waitForClose() {
        if (this.vim === null) throw new Error('Vim not started');
        return new Promise((r, j) => {
            this.on('close', r);
            this.vim.on('error', j);
        });
    }
}

export default Vim;