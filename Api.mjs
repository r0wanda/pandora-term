import ch from 'chalk';
import Xvfb from 'xvfb';
import path from 'node:path';
import rgb2hex from 'rgb2hex';
import invert from 'invert-color';
import { decodeHTML } from 'entities';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import adblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import _pptr from 'puppeteer';
import pptr from 'puppeteer-extra';
import * as S from './selectors.mjs';
import sleep from './sleep.mjs';
import HTTP from './HTTP.mjs';

pptr.use(stealthPlugin());
const adblocker = adblockerPlugin({
	blockTrackers: true,
});
pptr.use(adblocker);

class Api extends HTTP {
	// Vars
	browse;
	page;
	udd;
	xvfb;
	keybinds;
	loaded;

	constructor() {
		super();
		this.keybinds = {
			playPause: false,
		};
		this.udd = path.join(this.dirname, 'data');
		this.xvfb = new Xvfb(S.XVFB_OPTS);
		this.loaded = false;
		this.executablePath = _pptr.executablePath();
	}

    /**
     * The function that handles keystokes
     * @param {Array<string>} pressed 
     * @returns {Promise<void>}
     */
	async keyHandler(pressed) {
		// Play/Pause
		let playPressed = false;
		for (const key of this.config.keybinds.play_pause) {
			if (pressed.includes(key)) playPressed = true;
			else this.keybinds.playPause = false;
		}

		for (const key of this.config.keybinds.play_pause_exclude) playPressed = pressed.includes(key) ? false : playPressed;

		if (playPressed && !this.keybinds.playPause) {
			await this.playPause();
			this.keybinds.playPause = true;
		}
	}

    /**
     * The close function that stops xvfb and closes the browser
     * @returns {Promise<void>}
     */
	async close() {
		await super.close();
		if (this.browse && this.browse.isConnected) {
			await this.browse.close();
		}

		if (this.xvfb) {
			this.xvfb.stopSync();
		}

		process.exit(0);
	}

    /**
     * Autoaccept function (For cookies and violations)
     * @param {Page} page 
     * @param {boolean} violation 
     * @returns {Promise<void>}
     */
	async autoAccept(page, violation = true) {
		if (this.config.autoAccept.cookies) {
			await page.evaluate(S => {
				setInterval(() => {
					const cookieBtn = document.querySelector(S.COOKIES);
					if (cookieBtn) cookieBtn.click();
				}, 1000);
			}, S);
		}

		if (this.config.autoAccept.violation && violation) {
			await page.evaluate(S => {
				setInterval(() => {
					const violation = document.querySelector(S.VIOLATION);
					if (violation) violation.click();
				}, 250);
			}, S);
		}
	}

	// Init functions
    /**
     * Init function
     * @returns {Promise<void>}
     */
	async init() {
		// Login
		this.browse = await pptr.launch({
			headless: false,
			userDataDir: this.udd,
			defaultViewport: null,
			args: S.ARGS.concat(S.MUTE),
			executablePath: this.executablePath
		});
		console.log(ch.blue('Browser started, logging in...'));
		const [page] = await this.browse.pages();
		await this.autoAccept(page);
		await page.waitForSelector(S.AVATAR, {
			visible: true,
			timeout: 0,
		});
		await page.waitForNetworkIdle();
		await page.evaluate(() => {
			setTimeout(() => {
				alert('Saving, click ok and do not close this window');
			}, 1);
		});
		await page.waitForTimeout(this.config.timeout);
		await this.browse.close();

		// Init
		await new Promise((r, j) => {
			this.xvfb.start(error => {
				if (error) {
					j(error);
				} else {
					r();
				}
			});
		});
		this.browse = await pptr.launch({
			headless: false,
			userDataDir: this.udd,
			defaultViewport: null,
			ignoreDefaultArgs: S.MUTE,
			args: S.ARGS.concat(S.XVFB(this.xvfb)),
			executablePath: this.executablePath
		});
		console.log(ch.blue('Browser started with XVFB'));
		this.page = (await this.browse.pages())[0];
		// await this.page.reload();
		console.log(ch.blue('Collection loaded'));
		console.log(await this.page.cookies());
		await this.page.waitForNetworkIdle({
			idleTime: 1000
		});
		await this.page.screenshot({path: this.config.screenshot_path});
		if (!(await this.page.$(S.AVATAR))) {
			throw new Error('CRITICAL: Login failed, or cookies did not save/load!');
		}
		await this.autoAccept(this.page);
		await super.init(this.keyHandler.bind(this));
		console.log(ch.green('Login successful'));
		this.loaded = true;
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
			if (S.ERRS.CLOSED(err)) console.error(S.ERRS.CLOSED_MSG('getSong'));
			else console.error(err);
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
			if (S.ERRS.CLOSED(err)) console.error(S.ERRS.CLOSED_MSG('getArtist'));
			else console.error(err);
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
			if (S.ERRS.CLOSED(err)) console.error(S.ERRS.CLOSED_MSG('getDuration'));
			else console.error(err);
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
					fg: 'black',
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
			if (S.ERRS.CLOSED(err)) console.error(S.ERRS.CLOSED_MSG('getColors'));
			else console.error(err);
			return {
				bg: 'white',
				fg: 'black',
			};
		}
	}

	// Helpers
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
			if (
				this.page.isClosed() ||
		    	this.keybinds.playPause ||
				(!await this.page.$(S.SONG.PLAY) && !this.page.$(S.SONG.PAUSE))
			) return;
		    await this.page.evaluate(S => {
		    	(document.querySelector(S.SONG.PLAY) ?? document.querySelector(S.SONG.PAUSE)).click();
		    }, S);
        } catch (err) {
			if (S.ERRS.CLOSED(err)) console.error(S.ERRS.CLOSED_MSG('getColors'));
			else console.error(err);
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
			await this.page.screenshot({
				path: path.join(this.config.tmp, 'collection.png')
			});

			const grid = await this.page.evaluate(S => {
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
							let	nth = 1;
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
				const infiniteGrid = document.querySelector(S.MYMUSIC.INFINITEGRID);
				//throw new Error(cssPath(infiniteGrid.innerHTML));
				for (const child of infiniteGrid.children) {
					const res = {
						img: S.PLACEHOLDER,
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
					res.img = child.querySelector(S.MYMUSIC.ITEM_THUMBNAIL).src;
					const first = child.querySelector(S.MYMUSIC.ITEM_FIRST);
					res.first.elem = cssPath(first);
					res.first.content = first.innerText;
					const second = child.querySelector(S.MYMUSIC.ITEM_SECOND);
					const secondLink = second.querySelector('a');
					if (secondLink) {
						res.second.link = true;
						res.second.content = secondLink.innerText;
						res.second.elem = cssPath(secondLink);
					} else {
						res.second.content = second.childNodes[0].nodeValue;
						res.second.elem = cssPath(second);
					}

					const third = child.querySelector(S.MYMUSIC.ITEM_THIRD);
					if (third) {
						res.third.exists = true;
    					const third_txt = third.querySelector(S.MYMUSIC.ITEM_THIRD_TXT);
    					const third_e = third.querySelector(S.MYMUSIC.ITEM_THIRD_E);
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
			}, S);
			return grid;
		} catch (err) {
			console.error(err);
		}
	}
}

export default Api;