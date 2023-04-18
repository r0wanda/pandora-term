import bl from 'blessed';
import Img from '../Img.mjs';
import HTTP from '../HTTP.mjs';
var scr = bl.screen({
    smartCSR: true
});
scr.key(['escape', 'q', 'C-c'], async () => {
    process.exit(0);
});
/*const http = new HTTP();
const img = new Img(http, true);
await img.init();
console.log(img);
scr.append(await img.img('./test.png', {
    top: 0,
    left: 0
}, '50%'));*/
const box = bl.image({
    top: '20%',
    left: 'center',
    width: '40%',
    height: '40%',
    type: 'overlay',
    file: 'tmp/15tG7jbq6.png',
    w3m: '/usr/lib/w3m/w3mimgdisplay'
});
/*const box = bl.box({
    top: 0,
    left: 0,
    tags: true,
    width: 100,
    height: 50,
    content: await img.default('./test.png', 100, 50, 1)
});*/
scr.append(box);
scr.render();
//console.log(await img.default('./test.png', process.stdout.rows * 2.5));

