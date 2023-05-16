import { execSync as exec } from 'node:child_process';
import Screen from './Screen.mjs';

class XWininfo extends Screen {
    id;
    invalidID;
    pixelH;
    pixelW;
	ratio
    constructor(auto = true) {
        super();
        this.invalidID = new Error('XWininfo: $WINDOWID is not defined');
        this.processID(auto);
        this.calcPixelDimensions();
    }
    testID(id) { // Returns true if ID is valid, otherwise false
        try {
            this.execXWin(id);
            return true;
        } catch {
            return false;
        }
    }

    calcPixelDimensions() {
        const xwin = this.getXWin(true);
        const h = xwin.height;
        const w = xwin.width;
        this.pixelH = Math.round(h / this.rows);
        this.pixelW = Math.round(w / this.cols);
    }

    propW(h) {
        return Math.round(h * this.pixelH / this.pixelW);
    }
    propH(w) {
        return Math.round(w * this.pixelW / this.pixelH);
    }
    wPerProp(h) {
        return this.propW(this.hPer(h));
    }
    hPerProp(w) {
        return this.propH(this.wPer(w));
    }
	
    /**
     * Parse raw output of xwininfo
     * @param {string} out Pass output of #execXWin
     */
    parseXWin(out, toLC = false) {
        var res = {
            id: -1,
            title: ''
        }
        out = out.split('\n');
        for (var i = 0; i < out.length; i++) {
            if (i === 0) {
                if (out[i].includes('X Error')) throw new Error(out.join('\n'));
            } else if (i === 1) {
                var line = out[i].split(':');
                res.id = parseInt(line[line.indexOf(' Window id') + 1].split('"')[0].trim());
                var title = line.join(':').split('"');
                title.shift();
                res.title = title.filter(w => w.length > 0).join('"');
            } else {
                if (out[i].includes(':')) {
                    var line = out[i].split(':');
                    var key = line[0].trim();
                    var val = line[1].trim();
                    if (!isNaN(val)) val = parseInt(val);
                    res[toLC ? key.toLowerCase() : key] = val;
                }
            }
        }
        return res;
    }

    /**
     * Runs xwininfo and returns raw stdout. Will throw error if command fails
     * @param {number} id 
     * @param {boolean|string[]} args 
     * @returns {string}
     */
    execXWin(id, args = false) {
        args = Array.isArray(args) ? args.join(' ') : typeof args === 'string' ? args : `-id ${id.toString()}`;
        const out = exec(`xwininfo ${args}`);
        return out.toString('utf8');
    }
    processID(auto) {
        if (auto === true) {
            var id = process.env.WINDOWID;
            id = parseInt(id);
            if (!this.testID(id)) throw this.invalidID;
            this.id = id;
        } else if (typeof auto === 'number') {
            if (!this.testID(auto)) throw this.invalidID;
        }
    }
    getXWin(toLC = false, id = this.id) {
        return this.parseXWin(this.execXWin(id), toLC);
    }
}

export default XWininfo;
