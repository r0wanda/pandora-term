import bl from 'blessed';
import ww from 'word-wrap';

/*
 * (Somewhat janky) Notification system for blessed
 */

class Notifications {
    scr;
    notifs;
    totalHeight;
    transparent;

    constructor(scr, transparent = false) {
        this.scr = scr;
        this.transparent = transparent;

        this.notifs = new Map();
        this.totalHeight = 0;

        this.notif = bl.box({
            top: '5%',
            right: 2,
            width: 27,
            height: 'shrink',
            style: {
                bg: this.transparent ? null : 'black'
            }
        });
        this.scr.append(this.notif);
    }

    setTransparent(t) {
        this.transparent = t;
        const bg = this.transparent ? null : 'black'
        this.notif.style.bg = bg;
        this.notif.children.map(n => {
            n.style.bg = bg;
            n.style.border.bg = bg;
            n.setLabel({ text: `{${n.style.fg}-fg}${this.transparent ? '' : '{black-bg}'}${this.notifs.get(n)}{/}` });
        });
        this.scr.render();
    }

    transitionOut(notif, color) {
        var title = this.notifs.get(notif);
        var _totalHeight = 0;
        if (notif.height !== 2) {
            var content = notif.getContent().split('\n');
            content.pop();
            content = content.join('\n');
            notif.height--;
        } else if (notif.width !== 2) {
            notif.width--;
            if (notif.width > 2) notif.left++;
            if (notif.width - 2 <= title.length && notif.width !== 2) {
                title = title.substring(0, title.length - 1);
                this.notifs.set(notif, title);
                notif.setLabel({ text: `{${color}-fg}${this.transparent ? '' : '{black-bg}'}${title}{/}` });
            }
        } else {
            this.notif.remove(notif);
        }
        this.notif.children.map(n => {
            n.top = _totalHeight;
            _totalHeight += n.height;
        });
        if (this.notif.children.length === 0) this.notif.hide();
        this.totalHeight = this.totalHeight;
        this.scr.render();
    }

    msg(title, desc, color) {
        desc = ww(desc, {
            width: '25',
            indent: '',
            trim: true
        });
        var timeout = (1500 * desc.split('\n').length) + 5000;
        const height = desc.split('\n').length + 2;
        this.notif.show();
        const notif = bl.box({
            top: this.totalHeight,
            left: 0,
            width: 27,
            height: height,
            label: `{${color}-fg}${this.transparent ? '' : '{black-bg}'}${title}{/}`,
            tags: true,
            content: desc,
            border: {
                type: 'line',
            },
            style: {
                bg: this.transparent ? null : 'black',
                fg: color,
                border: {
                    fg: color,
                    bg: this.transparent ? null : 'black'
                }
            }
        });
        this.totalHeight += height;
        this.notif.append(notif);
        this.notifs.set(notif, title);
        this.scr.render();
        setTimeout((notif => {
            setInterval(this.transitionOut.bind(this), 50, notif, color);
            this.scr.render();
        }).bind(this), timeout, notif);
    }

    info(title, desc) {
        this.msg(title, desc, '#00A0FF');
    }
    warn(title, desc) {
        this.msg(title, desc, 'yellow');
    }
    err(title, desc) {
        this.msg(title, desc, 'red');
    }
}

export default Notifications;