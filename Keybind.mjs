import gkm from 'gkm';

/*
 * Keybind
 * Abstract class for receiving keystroke events in a terminal
 * Keystroke events are rescieved even if the terminal is not the focused window
 */

class Keybind {
	int;
	config;
	/**
	 * The init function
	 * @param {function} handler 
	 * @returns {Promise<void>}
	 */
	async init(handler) {
		const pressed = [];

		gkm.events.on('key.*', function (data) {
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
	}

	/**
	 * The close funtion (removes all listeners)
	 * @returns {Promise<void>}
	 */
	async close() {
		gkm.events.removeAllListeners('key.*');
		clearInterval(this.int);
	}
}

export default Keybind;
