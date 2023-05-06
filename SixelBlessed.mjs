import bl from 'blessed';
import SixelBase from './SixelBase.mjs';

class SixelBlessed extends SixelBase {
    constructor() {
        super();
    }
    /**
     * 
     * @param {string} path Path to file to be sixel-ized
     * @param {Object} args Blessed arguments (cannot include the "content" key)
     * @param {boolean} incWidth Whether to set custom width or use width in args
     */
    async proc(path, args, incWidth = false) {
        if (typeof args.height === 'string' && args.height.includes('%')) args.height = Math.round(this.pH * parseInt(args.height.replace(/%/g, '')));
        const sixel = await super.proc(path, args.height, incWidth ? args.width : false);
        const box = bl.box({
            ...args,
            content: sixel
        });
        return box;
    }
}

const scr = bl.screen({
    smartCSR: true
});
scr.key(['escape', 'q', 'C-c'], () => {
    process.exit(0);
});
const six = new SixelBlessed();
scr.append(await six.proc('/home/rowan/Pictures/skull.jpg', {
    top: 1,
    left: 1,
    width: 'shrink',
    height: 5
}));
scr.render();

export default SixelBlessed;
