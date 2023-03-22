import bl from 'blessed';
import ww from 'word-wrap';

class Notifications {
    scr;
    notifs;
    totalHeight;

    constructor(scr) {
        this.scr = scr;
        this.notifs = [];
        this.totalHeight = 0;
    }

    msg(title, desc, color) {
        desc = ww(desc, { width: '25' });
        const notif = bl.box({
            top: `5%+${this.totalHeight.toString()}`,
            right: 2,
            width: 27,
            height: desc.split('\n').length + 2,
            content: ww,
            border: {
                type: 'line',
            },
            style: {

            }
        });
    }

    info(title, desc) {
        this.msg(title, desc, '#00A0FF');
    }
}

export default Notifications;