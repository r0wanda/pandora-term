import ch from 'chalk';
import Xvfb from 'xvfb';
import { sync as cmdEx } from 'command-exists';
import HTTP from './HTTP.mjs';

class Xdo extends HTTP {
    xvfb;
    xLock;
    display;
    constructor(display = 99) {
        super();
        this.check();
        this.xvfb = new Xvfb({
            displayNum: 99,
            reuse: true,
            xvfb_args: ['-ac', '-screen', '0', '1920x1080x24'],
        });
        this.display = display
    }
    check() {
        if (!cmdEx('Xvfb')) {
            console.log(ch.red('Xfvb not installed!'));
            throw new Error();
        }
    }
    startXvfb() {
        this.xvfb.startSync();
        console.error(this.xvfb);
    }
}

export default Xdo;