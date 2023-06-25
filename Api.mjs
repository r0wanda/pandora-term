import ch from 'chalk';
import path from 'node:path';
import rgb2hex from 'rgb2hex';
import invert from 'invert-color';
import { decodeHTML } from 'entities';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { chromium as pptr } from 'playwright-extra';
import * as S from './selectors.mjs';
import Xdo from './Xdo.mjs';

pptr.use(stealthPlugin());

class Api extends Xdo {
	// Vars
	browse;
	page;
	udd;
	error;
	keybinds;
	loaded;
	#closeCount;
	#loopsSinceClose;
	#prevCloseCount;

	constructor() {
		super();
		this.keybinds = {
			playPause: false,
		};
		this.udd = path.join(this.dirname, 'data');
		this.loaded = false;
		this.error = false;
		this.#closeCount = 0;
		this.#loopsSinceClose = 0;
		this.#prevCloseCount = 0;
		setInterval(this.#closeFunc.bind(this), 1000);
	}

	/**
	 * Function that handles an unexpected session closure (not because of a slow quit request)
	 * @returns {Promise<void>}
	 */
	async #closeFunc() {
		if (!this.config.system.closeCounter) return;
		if (this.#prevCloseCount < this.#closeCount) this.#loopsSinceClose = 0;
		if (this.#loopsSinceClose > 5) this.#closeCount = 0;
		this.#prevCloseCount = this.#closeCount;
		// This will only trigger when the machine wakes from sleep, or something else cauing the browser/tab to close other than a normal app quit
		if (this.#closeCount > 20) {
			console.log('Closing because of a session close. This should not happen out of nowhere.');
			console.log('This is normal after the machine wakes from sleep.');
			process.exit(1);
		}
	}

	/**
	 * The function that handles keystrokes
	 * @param {Array<string>} pressed 
	 * @returns {Promise<void>}
	 */
	async keyHandler(pressed) {
		// Play/Pause
		var playPressed = false;
		for (const key of this.config.keybinds.play_pause) {
			if (pressed.includes(key)) playPressed = true;
			else this.keybinds.playPause = false;
		}

		for (const key of this.config.keybinds.play_pause_exclude) {
			if (pressed.includes(key)) playPressed = false;
		}

		if (playPressed && !this.keybinds.playPause) {
			await this.playPause();
			this.keybinds.playPause = true;
		}
	}

	setError(err) {
		this.error = err;
	}

	/**
	 * The close function (stops xvfb and closes the browser)
	 * @returns {Promise<void>}
	 */
	async close() {
		setTimeout(process.exit, 15000, 1);
		await super.close();
		if (this.browse && this.browse.isConnected) {
			await this.browse.close();
		}
		if (this.xvfb) {
			this.xvfb.stopSync();
		}
		if (!this.error) process.exit(0);
		else process.exit(1);
	}

	/**
	 * Autoaccept function (For cookies and violations)
	 * @param {Page} page 
	 * @returns {Promise<void>}
	 */
	async autoAccept(page) {
		if (this.config.system.autoAccept.cookies) {
			await page.evaluate(S => {
				var clicked = false;
				setInterval(() => {
					const cookieBtn = document.querySelector(S);
					if (!clicked && cookieBtn) {
						clicked = true;
						cookieBtn.click();
					}
				}, 500);
			}, S.COOKIES);
		}

		if (this.config.system.autoAccept.violation) {
			await page.evaluate(S => {
				setInterval(() => {
					const violation = document.querySelector(S);
					if (violation) violation.click();
				}, 250);
			}, S.VIOLATION);
		}
	}

	/**
	 * Sets listeners to log console output in puppeteer (for debug only)
	 * @param {Page} page 
	 * @returns {Promise<void>}
	 */
	async logPPTRConsole(page) {
		page
			.on('console', message =>
				console.error(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
			.on('pageerror', ({ message }) => console.error(message))
			.on('response', response =>
				console.error(`${response.status()} ${response.url()}`))
			.on('requestfailed', request =>
				console.error(`${request.failure().errorText} ${request.url()}`));
	}

	// Init functions
	/**
	 * Init function
	 * @returns {Promise<void>}
	 */
	async init() {
		try {
		await super.init();
		// Login
		this.browse = await pptr.launchPersistentContext(this.udd, {
			headless: false,
			args: S.ARGS.concat(S.MUTE, S.APP)
		});
		console.log(ch.blue('Browser started, logging in...'));
		const [page] = await this.browse.pages();
		const xwin = this.parseXWin(this.execXWin(false, ['-root']), true);
		console.error(xwin);
		await page.setViewportSize({
			width: xwin.width,
			height: xwin.height
		});
		//await this.logPPTRConsole(page);
		await this.autoAccept(page);
		console.log(ch.blue('Autoaccept started'));
		await page.waitForSelector(S.AVATAR);
		//await page.waitForLoadState('networkidle');
		console.log(ch.blue('Page loaded'));
		await page.evaluate(() => {
			setTimeout(() => {
				alert('Saving, click ok and do not close this window');
			}, 1);
		});
		await page.waitForTimeout(this.config.timeout);
		await this.browse.close();
		console.log(ch.blue('Visual signin done'));

		// Init
		try {
			this.startXvfb();
		} catch (err) {
			console.error(err);
			await this.close();
		}
		this.browse = await pptr.launchPersistentContext(this.udd, {
			headless: false,
			ignoreDefaultArgs: S.MUTE,
			args: S.ARGS.concat([`--display=:99`])
		});
		console.log(ch.blue('Browser started with XVFB') + '\n' + ch.green('Loading page...'));
		this.page = await this.browse.newPage();
		await this.page.setViewportSize({
			width: xwin.width,
			height: xwin.height
		});
		await this.page.goto('https://pandora.com/collection/');
		//this.logPPTRConsole(this.page);
		// await this.page.reload();
		await this.page.waitForLoadState('load');
		try {
			await this.page.waitForSelector(S.AVATAR, {
				timeout: 15000
			});
		} catch (err) {
			console.error(err);
			if (this.config.system.screenshot) await this.page.screenshot({ path: this.config.screenshot_path, fullPage: true });
			throw new Error(err);
		}
		if (this.config.system.screenshot) await this.page.screenshot({ path: this.config.screenshot_path, fullPage: true });
		if (!(await this.page.$(S.AVATAR))) {
			throw new Error('CRITICAL: Login failed, or cookies did not save/load!');
		}
		console.log(ch.green('Login successful'));
		await this.autoAccept(this.page);
		console.log(ch.blue('Autoaccept started'));
		console.log(ch.green('Starting TUI'));
		this.loaded = true;
		} catch (err) {
			console.log('Error');
			console.error(err);
			await this.close();
		}
	}

	// Getters
	/**
	 * Song title getter
	 * @returns {Promise<string|null>}
	 */
	async getSong() {
		try {
			return decodeHTML(await this.query2html(S.SONG.TITLE));
		} catch (err) {
			this.handleError(err, 'getSong');
			return null;
		}
	}

	/**
	 * Song artist getter
	 * @returns {Promise<string|null>}
	 */
	async getArtist() {
		try {
			return decodeHTML(await this.query2html(S.SONG.ARTIST));
		} catch (err) {
			this.handleError(err, 'getArtist');
			return null;
		}
	}

	/**
	 * Song duration getter
	 * @returns {Promise<string|null>}
	 */
	async getDuration() {
		try {
			const elapsed = await this.query2html(S.SONG.ELAPSED);
			const remaining = await this.query2html(S.SONG.REMAINING);
			const template = `${elapsed} | ${remaining} `;
			return template;
		} catch (err) {
			this.handleError(err, 'getDuration');
			return null;
		}
	}

	/**
	 * @typedef {Object} Colors
	 * @property {string} fg Foreground Color
	 * @property {string} bg Background Color
	 */
	/**
	 * Song color getter
	 * @returns {Promise<Colors>}
	 */
	async getColors() {
		try {
			const bgColor = await this.page.$eval(S.SONG.BAR, e => e.style.backgroundColor);
			if (!bgColor) {
				return {
					bg: 'white',
					fg: 'black'
				};
			}

			const bg = rgb2hex(
				bgColor,
			).hex;
			const fg = invert(bg, true);
			return {
				bg,
				fg,
			};
		} catch (err) {
			this.handleError(err, 'getColors');
			return {
				bg: 'white',
				fg: 'black',
			};
		}
	}

	/**
	 * Get song play-pause state
	 * @returns {Promise<boolean>} False for paused, True for play
	 */
	async getPlayPause() {
		try {
			return await this.page.$(S.SONG.PAUSE) ?? false;
		} catch (err) {
			this.handleError(err, 'getPlayPause');
			return false;
		}
	}

	/**
	 * Get existing buttons
	 * @returns {Promise<object>} An object containing true/false values representing each button's existance
	 */
	async getButtons() {
		try {
			return await this.page.evaluate(S => {
				return {
					skip: (document.querySelector(S.SKIP) || document.querySelector(S.SKIP2)) !== null,
					rewind: document.querySelector(S.REWIND) !== null,
					replay: document.querySelector(S.REPLAY) !== null,
					thumbs: {
						up: document.querySelector(S.THUMBS.UP) !== null,
						down: document.querySelector(S.THUMBS.DOWN) !== null
					}
				}
			}, S.SONG);
		} catch (err) {
			this.handleError(err, 'getButtons');
			return false;
		}
	}

	// Other methods
	/**
	 * Get property form CSS selector
	 * @param {string} element The CSS selector for the element
	 * @param {string} prop The property name to be requested
	 * @returns {Promise<string>}
	 */
	async query2html(element, prop = 'innerHTML') {
		return await this.page.$eval(element, (e, p) => e[p], prop);
	}

	/**
	 * Play/Pause function
	 * @returns {Promise<void>}
	 */
	async playPause() {
		try {
			console.error('playpausing')
			await this.page.evaluate(S => {
				(document.querySelector(S.PLAY) ?? document.querySelector(S.PAUSE)).click();
			}, S.SONG);
		} catch (err) {
			this.handleError(err, 'playPause');
			return;
		}
	}

	/**
	 * Skip function
	 * @returns {Promise<void>
	 */
	async skip() {
		try {
			console.error('skip')
			await this.page.evaluate(S => {
				(document.querySelector(S.SKIP) ?? document.querySelector(S.SKIP2)).click();
			}, S.SONG);
		} catch (err) {
			this.handleError(err, 'skip');
			return;
		}
	}

	/**
	 * Rewind/Replay function
	 * @returns {Promise<void>}
	 */
	async rewind() {
		try {
			console.error('rewind');
			await this.page.evaluate(S => {
				(document.querySelector(S.REWIND) ?? document.querySelector(S.REPLAY)).click();
			}, S.SONG);
		} catch (err) {
			this.handleError(err, 'rewind');
			return;
		}
	}
	async repeat() {
		try {
			console.error('repeat');
			await this.page.evaluate(S => {
				(document.querySelector(S.REWIND) ?? document.querySelector(S.REPLAY)).click();
			}, S.SONG);
		} catch (err) {
			this.handleError(err, 'repeat');
			return;
		}
	}
	

	/**
	 * @typedef {Object} CollectionItem
	 * @property {string} img The cover URL
	 * @property {Object} first The first item of metadata
	 * @property {Object} second The second item of metadata
	 * @property {Object} third The third item of metadata
	 */
	/**
	 * @typedef {Array<CollectionItem>} Collection
	 */
	/**
	 * Get collection
	 * @returns {Promise<Collection>}
	 */
	async collection() {
		try {
			if (!this.page.$(S.MYMUSIC.INFINITEGRID)) {
				return null;
			}

			await (await this.page.$(S.MYMUSIC.COLLECTION)).click();

			await this.page.waitForSelector(S.MYMUSIC.INFINITEGRID, {
				timeout: this.config.collection_timeout
			});
			if (this.config.system.screenshot) await this.page.screenshot({
				path: path.join(this.config.tmp, 'collection.png')
			});

			const grid = await this.page.evaluate(S => {
				try {
					function cssPath(element) {
						if (!(element instanceof Element)) {
							return;
						}

						const path = [];
						while (element.nodeType === Node.ELEMENT_NODE) {
							let selector = element.nodeName.toLowerCase();
							if (element.id) {
								selector += '#' + element.id;
								path.unshift(selector);
								break;
							} else {
								let sib = element;
								let nth = 1;
								while (sib = sib.previousElementSibling) {
									if (sib.nodeName.toLowerCase() == selector) {
										nth++;
									}
								}

								if (element.previousElementSibling != null || element.nextElementSibling != null) {
									selector += ':nth-of-type(' + nth + ')';
								}
							}

							path.unshift(selector);
							element = element.parentNode;
						}
						return path.join(' > ');
					} // From: https://stackoverflow.com/a/12222317

					const collection = [];
					const infiniteGrid = document.querySelector(S.INFINITEGRID);
					//throw new Error(cssPath(infiniteGrid.innerHTML));
					for (const child of infiniteGrid.children) {
						const res = {
							img: 'placeholder',
							play: cssPath(child) + S.ITEM_PLAY,
							first: {
								elem: '',
								link: true,
								content: '',
							},
							second: {
								elem: '',
								link: false,
								content: '',
							},
							third: {
								exists: false,
								elem: '',
								link: false,
								content: '',
								explicit: false,
								clean: false,
							}
						}
						res.img = child.querySelector(S.ITEM_THUMBNAIL).src;
						const first = child.querySelector(S.ITEM_FIRST);
						res.first.elem = cssPath(first);
						res.first.content = first.innerText;
						const second = child.querySelector(S.ITEM_SECOND);
						const secondLink = second.querySelector('a');
						if (secondLink) {
							res.second.link = true;
							res.second.content = secondLink.innerText;
							res.second.elem = cssPath(secondLink);
						} else {
							res.second.content = second.childNodes[0].nodeValue;
							res.second.elem = cssPath(second);
						}

						const third = child.querySelector(S.ITEM_THIRD);
						if (third) {
							res.third.exists = true;
							const third_txt = third.querySelector(S.ITEM_THIRD_TXT);
							const third_e = third.querySelector(S.ITEM_THIRD_E);
							res.third.elem = cssPath(third);
							res.third.content = third_txt.innerText;
							if (third_e) {
								switch (third_e.innerText.toLowerCase()) {
									case 'e':
										res.third.explicit = true;
										break;
									case 'clean':
										res.third.clean = true;
										break;
								}
							}
						}
						collection.push(res);
					}
					return collection;
				} catch {
					return false;
				}
			}, S.MYMUSIC);
			return grid;
		} catch (err) {
			this.handleError(err, 'collection');
		}
	}

	/**
	 * Play a collection item
	 * @param {object} item The collection item
	 * @returns {Promise<void>}
	 */
	async playCollectionItem(item) {
		try {
			console.error("item: " + item.play);
			await this.page.screenshot({
				path: './col.png'
			});
			await this.page.evaluate(play => {
				document.querySelector(play.c).click();
				document.querySelector(play.play).click();
			}, { play: item.play, c: S.MYMUSIC.COLLECTION });
			setTimeout(async () => {
				await this.page.screenshot({
					path: './item.png'
				});
			}, 2000);
		} catch (err) {
			this.handleError(err, 'playCollectionItem');
		}
	}

	async waitForElements(pr, timeout = 5000) {
		const promises = [];
		pr.map(e => {
			promises.push(new Promise((async (r, j) => {
				try {
					await this.page.waitForSelector(e, {
						timeout
					});
					r();
				} catch (err) {
					j(err);
				}
			}).bind(this)))
		}, this);
		return await Promise.any(promises);
	}
	/**
	 * Get song page
	 * @returns {Promise<object>}
	 */
	async songPage() {
		try {
			await this.page.evaluate(S => {
				document.querySelector(S.BAR_HIT).click();
			}, S.SONG);
			await this.waitForElements([S.SONG.BAR_PAGE.ONDEMAND.ONDEMAND, S.SONG.BAR_PAGE.NOWPLAYING.NOWPLAYING]);
			var songpage = await this.page.evaluate(S => {
				try {
					var res = {
						bg: '#000000',
						left: null,
						center: false
					}
					res.bg = document.querySelector(S.ONDEMAND.BG).getAttribute('fill') ?? '#000000';
					const leftcol = document.querySelector(S.ONDEMAND.LEFT_COL.LEFT_COL);
					const center = document.querySelector(S.NOWPLAYING.CENTER.CENTER);
					res.center = center;
					if (leftcol) {
						const collected = document.querySelector(S.ONDEMAND.LEFT_COL.COLLECTED);
						const title = document.querySelector(S.ONDEMAND.LEFT_COL.TITLE) ?? 'Untitled';
						const artist = document.querySelector(S.ONDEMAND.LEFT_COL.ARTIST) ?? false;
						res.left = {
							header: {
								collected,
								title,
								artist
							}
						}
					} else if (center) {
						const session = document.querySelector(S.NOWPLAYING.CENTER.SESSION).innerText;
						var imgs = document.querySelectorAll(S.NOWPLAYING.CENTER.IMG);
						imgs = [...imgs];
						imgs = imgs.map(img => img.src);
						res.center = {
							session,
							img: imgs[0],
							imgs: imgs
						}
					}
					return res;
				} catch (err) {
					return err.toString();
				}
			}, S.SONG.BAR_PAGE);
			if (songpage.center) {
				songpage.center.img = await this.fetch(songpage.center.img);
				const newImgs = [];
				for (var i of songpage.center.imgs) {
					newImgs.push(await this.fetch(i));
				}
				songpage.center.imgs = newImgs;
			}
			return songpage;
		} catch (err) {
			this.handleError(err, 'songpage');
		}
	}
	handleError(err, func) {
		if (S.ERRS.CLOSED(err)) {
			this.#closeCount++;
			console.error(S.ERRS.CLOSED_MSG(func));
		} else console.error(err);
	}
}

export default Api;