const Jimp = require('jimp');
const rgb2hex = require('rgb2hex');

exports.default = async (img, w, h = null, mode = 0, charpick = 0) => { // Mode 0 = escape codes, mode 1 = blessed
    var chars = [
        [" ", ".", ":", "!", "+", "*", "e", "$", "@", "#"],
        [' ', '.', ':', '!', '+', 'H', '░', '▒', '▓', '█']
    ][charpick];
    img = await Jimp.read(img);
    img = img.resize(w, h ? h : Jimp.AUTO);
    var newcols = img.bitmap.width;
    var newrows = img.bitmap.height;
    if (newcols > process.stdout.columns) {
        newcols = process.stdout.columns;
    }
    if (newrows > process.stdout.rows) {
        newrows = process.stdout.rows;
    }
    if (newcols !== img.bitmap.width || newrows !== img.bitmap.height) {
        img = img.resize(newcols, newrows);
    }
    var pY = 0;
    var res = '';
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
        var r = this.bitmap.data[idx + 0];
        var g = this.bitmap.data[idx + 1];
        var b = this.bitmap.data[idx + 2];
        var i = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        var current = i <= 25 ? chars[0] :
		i <= 51 && i > 25 ? chars[1] :
		i <= 76 && i > 51 ? chars[2] :
		i <= 102 && i > 76 ? chars[3] :
		i <= 127 && i > 102 ? chars[4] :
		i <= 153 && i > 127 ? chars[5] :
		i <= 178 && i > 153 ? chars[6] :
		i <= 204 && i > 153 ? chars[7] :
		i <= 229 && i > 204 ? chars[8] :
		i <= 255 && i > 229 ? chars[9] : chars[9];
        if (y > pY) {
            res += '\n';
        }
        if (mode === 0) {
            res += '\033[38;2;' + r + ';' + g + ';' + b + 'm' + current;
        } else if (mode === 1) {
            var hex = rgb2hex(`rgb(${r},${g},${b})`).hex;
            res += `{${hex}-fg}${current}{/}`;
        }
        pY = y;
    });
    return res;
}