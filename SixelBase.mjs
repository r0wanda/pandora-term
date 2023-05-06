import { execSync as exec } from 'node:child_process';
import XWininfo from "./XWininfo.mjs";

class SixelBase extends XWininfo {
    constructor() {
        super();
    }
    async proc(path, h, w = false) {
        const args = [path, `-h${this.pixelH * h}`];
        if (w) args.push(`-w${this.pixelW * w}`);
        return exec(`img2sixel ${args.join(' ')}`);
    }
}

export default SixelBase;
