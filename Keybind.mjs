import { fromCode as keys } from 'linux-keycodes';
import BasicKbd from './BasicKbd.mjs';

/*
 * Keybind
 * Class for receiving keystroke events in a terminal
 * Keystroke events are recieved even if the terminal is not the focused window
 */
class Keybind extends BasicKbd {
	int;
	config;

	constructor() {
		super();
	}
	/**
	 * The init function
	 * @param {function} handler 
	 * @returns {Promise<void>}
	 */
	async initKeybind(handler) {
		try {
			const pressed = [];
			this.kbd.on('keypress', ev => {
				const data = keys(ev.code);
				if (!pressed.includes(data)) {
					pressed.push(data);
				}
			});
			this.kbd.on('keydown', ev => {
				const data = keys(ev.code);
				if (!pressed.includes(data)) {
					pressed.push(data);
				}
			});
			this.kbd.on('keyup', ev => {
				if (pressed.includes(data)) {
					pressed.splice(pressed.indexOf(data));
				}
			});
			this.int = setInterval(handler, 50, pressed);
			if (this.notifs) this.notifs.info('Keybind', 'Global keybinds initialized');
		} catch (err) {
			console.error(err);
			if (this.notifs) this.notifs.err('Keybind', 'Global keybinds failed to initialize, check logfile');
		}
	}

	/**
	 * The close funtion (removes all listeners)
	 * @returns {Promise<void>}
	 */
	async close() {
		clearInterval(this.int);
	}
}

export default Keybind;
