import got from 'got';
import ch from 'chalk';
import jimp from 'jimp';
import path from 'node:path';
import { randomBytes as rb } from 'node:crypto';
import { fileTypeFromBuffer as ftfb } from 'file-type';
import { writeFileSync as wf, readFileSync as rf, existsSync as ex, rmSync as rm } from 'node:fs';
import RPC from './RPC.mjs';

class HTTP extends RPC {
    files;

    constructor() {
        super(RPC.getAppID());
        this.files = [];
    }

    isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    #exRm(path) {
        try {
            rm(path);
        } catch (err) {
            if (err.path && ex(err.path)) {
                console.error(ch.redBright(
                    `WARNING: During cleanup, ${err.path} was not deleted due to error '${err.code}'`
                ));
            }
        }
        if (ex(path)) {
            console.error(ch.redBright(
                `WARNING: During cleanup, ${path} was not deleted`
            ));
        }
    }
    /**
     * The close funtion (cleans up files)
     * @returns {Promise<void>}
     */
    async close() {
        await super.close();
        for (const file of this.files) {
            this.#exRm(file);
        }
    }

    /**
     * Fetch URL
     * @param {string} url The URL to fetch
     * @param {boolean} save Whether or not to save the file, default true
     * @returns {Buffer|string} If save is false, the fetched buffer will be returned, otherwise a temporary file path will be returned
     */
    async fetch(url, save = true, cnvimg = true) {
        try {
            const res = await got(url).buffer();
            if (!save) return res;
            const fname = this.save(res, cnvimg);
            return fname;
        } catch (err) {
            console.error(err);
            console.error('Falling back to placeholder image');
            return path.join(this.dirname, 'placeholder.png');
        }
    }
    randBytes() {
        const bytes = rb(16)
            .toString('base64url')
            .substring(0, 9);
        return bytes;
    }
    async save(buf, cnvimg = true) {
        const bytes = this.randBytes();
        const { mime, ext } = await ftfb(buf);
        const isImg = mime.includes('image');
        const isPng = isImg ? ext === 'png' : false;
        const toCnv = isImg && !isPng && cnvimg;
        const fname = toCnv ? path.join(this.config.tmp, `${bytes}.png`) : path.join(this.config.tmp, `${bytes}.${ext}`);
        this.files.push(fname);
        if (toCnv) {
            const img = await jimp.read(buf);
            img.write(fname);
        } else {
            wf(fname, buf);
        }
        return fname;
    }
}

export default HTTP;