import ch from 'chalk';
import { join as ejoin } from 'desm';
import { join as pjoin } from 'node:path';
import { existsSync as ex } from 'node:fs';
import { execSync } from 'node:child_process';
import XWininfo from './XWininfo.mjs';

class AnsiImg extends XWininfo {
	path;
	/*
	 * @param {string|boolean} path Path to a directory containing a program equivalent to the one contained in the "cpp" directory, or false for the contained program.
	 */
	constructor(path = false) {
		super();
		if (!path) {
			path = ejoin(import.meta.url, 'cpp');
		}
		if (!this.validPath(path)) throw new Error('ANSI: Path argument is invalid');
		this.path = path;
	}
	validPath(path) {
		if (!ex(pjoin(path, 'Makefile'))) return false;
		if (!ex(pjoin(path, 'ansi'))) {
			console.log(ch.yellow('ANSI binary not found, compiling'));
			var start = Date.now();
			execSync(`make -C ${path}`);
			var time = Date.now() - start;
			console.log(ch.cyan(`Done in ${time}ms`));
		}
		return true;
	}
	/**
	 * 
	 * @param {string} path Path to file
	 * @param {boolean|string|number} w Options: false (Cover terminal), "50%" (or other percentage), or a number.
	 * @param {boolean|string|number} h Options: Same as w (+ "w" for equal side lengths)
	 * @returns 
	 */
	ansi(path, w = false, h = false) {
		w = w ?
			w.endsWith('%') ? this.wPer(parseInt(w.replace(/[^0-9]/g, ''))) :
			w : 
			this.cols;
		h = h ?
			h === 'w' ? this.propH(w) :
			h.endsWith('%') ? this.hPer(parseInt(h.replace(/[^0-9]/g, ''))) :
			h :
			this.rows;
		return execSync(`${pjoin(this.path, 'ansi')} ${path} ${w} ${h}`).toString('utf8').trim();
	}
}

export default AnsiImg;

