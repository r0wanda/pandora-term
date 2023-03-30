import bl from 'blessed';
import img from '../img.js';
var scr = bl.screen({
    smartCSR: true
});
scr.key(['escape', 'q', 'C-c'], async () => {
    process.exit(0);
});
const box = bl.box({
    top: 0,
    left: 0,
    tags: true,
    width: 100,
    height: 50,
    content: await img.default('./test.png', 100, 50, 1)
});
scr.append(box);
scr.render();
//console.log(await img.default('./test.png', process.stdout.rows * 2.5));
