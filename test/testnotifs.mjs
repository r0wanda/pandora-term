import bl from 'blessed';
import Notifications from "../Notifications.mjs";

// Should display all 3 notifications and animations correctly, and turn transparent 2 seconds in, and then turn opaque 2 seconds later.
// Note: Yellow background will not turn transparent

var scr = bl.screen({
    smartCSR: true
});
const box = bl.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus aliquet quam nec turpis tempus accumsan. Proin finibus augue id sodales cursus. Pellentesque volutpat ante quis dapibus sagittis. Morbi a tortor ante. Mauris pellentesque sem vitae leo pretium efficitur. Proin quis auctor nisi. Nulla malesuada magna quis sollicitudin maximus. Maecenas ornare, sem eu pretium consequat, odio sapien vestibulum risus, ut semper risus risus vitae risus. Donec vestibulum massa aliquet risus facilisis, id laoreet est dictum. Suspendisse pharetra eros quis nisl interdum mollis. Praesent urna eros, suscipit id nisi a, aliquet sodales augue. Vestibulum accumsan, magna id fringilla tristique, lorem purus suscipit mauris, eget eleifend sapien nisl eu lectus. Donec fringilla consequat purus, quis facilisis neque. Suspendisse porta congue urna, sit amet iaculis tortor pellentesque ut. Phasellus sodales turpis at elit varius molestie. Duis ac efficitur augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;',
    style: {
        bg: 'yellow',
        fg: 'red'
    }
});
scr.append(box);
scr.key(['escape', 'q', 'C-c'], async () => {
    process.exit(0);
});
scr.render();
const notif = new Notifications(scr);
notif.err('Error', 'Error!');
setTimeout(() => { notif.warn('Warning', 'Warning!'); }, 1000);
setTimeout(() => { notif.setTransparent(true); }, 2000)
setTimeout(() => { notif.setTransparent(false); }, 4000)
setTimeout(() => { notif.info('Info', 'A really long informational notification that should cause a word wrap resulting in a newline.'); }, 2000);