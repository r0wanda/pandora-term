import AnsiAPI from './AnsiImg.js';
import bl from 'blessed';
import supportsSixel from 'supports-sixel';

class Ansi {
    api;
    http;
    constructor(http) {
        this.http = http;
        this.api = AnsiAPI.default;
    }
    async img(img, options, w, h = null, blessed = true) {
        if (this.http.isUrl(img)) img = await this.http.fetch(img);
        else if (!(img instanceof Buffer)) img = await this.http.save(img);
        const res = await this.api(img, w, h, 0, blessed ? 1 : 0);
        return blessed ? bl.box({
            ...options,
            width: w,
            height: h,
            tags: true,
            content: i
        }) : res;
    }
}

class Sixel {
    http;
    constructor(http) {
        this.http = http;
        console.log(this.http.isURL('hetrg'));
    }
    /**
     * 
     * @param {string|Buffer} img 
     * @param {*} options 
     * @param {*} w 
     * @param {*} h 
     * @param {*} blessed 
     * @returns 
     */
    async img(img, options, w, h = null, blessed = true) {
        console.log('http:' + this.http);
        if (this.http.isUrl(img)) img = await this.http.fetch(img);
        else if (!(img instanceof Buffer)) img = await this.http.save(img);
        return blessed ? bl.image({
            ...options,
            width: w,
            height: h,
            type: 'overlay',
            file: img
        }) : res;
    }
}

class Img {
    overideSixel;
    sixel;
    api;
    http;

    constructor(http, overrideSixel = false) {
        this.overideSixel = overrideSixel;
        this.sixel = false;
        this.http = http;
    }

    async init() {
        const supports = await supportsSixel();
        this.sixel = this.overideSixel ? true : supports;
        var api;
        if (this.sixel) api = new Sixel(this.http);
        else api = new Ansi(http);
        this.api = api;
    }

    async img() {
        if (!this.api) return;
        await this.api.img(...arguments);
    }
}

export default Img;