import GKM from 'gkm-class';
import pgrep from 'find-process';

/*
 * Keybind
 * Class for receiving keystroke events in a terminal
 * Keystroke events are recieved even if the terminal is not the focused window
 */
class Keybind extends GKM {
	int;
	config;
	pid;

	constructor() {
		super();
		this.pid = this.gkm.pid;
	}
	/**
	 * The init function
	 * @param {function} handler 
	 * @returns {Promise<void>}
	 */
	async initKeybind(handler) {
		try {
		const pressed = [];
		this.on('key.*', function (data) { // Responds to any keypress and any key-release
			data = data[0];
			switch (this.event) {
				case 'key.pressed': {
					if (!pressed.includes(data)) {
						pressed.push(data);
					}

					break;
				}

				case 'key.released': {
					if (pressed.includes(data)) {
						pressed.splice(pressed.indexOf(data));
					}

					break;
				}

				default:
			}
		});
		this.int = setInterval(handler, 50, pressed);
		if (this.notifs) this.notifs.info('GKM', 'Global keybinds initialized');
		} catch (err) {
			console.error(err);
			if (this.notifs) this.notifs.err('GKM', 'Global keybinds failed to initialize, check logfile');
		}
	}

	async pgrep(cmd) {
		try {
			const procs = await pgrep('name', cmd, true);
			return procs.length > 0;
		} catch (err) {
			console.error(err);
			return false;
		}
	}

	/**
	 * The close funtion (removes all listeners)
	 * @returns {Promise<void>}
	 */
	async close() {
		clearInterval(this.int);
		this.quit();
	}
}

export default Keybind;
