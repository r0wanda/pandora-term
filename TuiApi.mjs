import bl from 'blessed';
import hasFlag from 'has-flag';
import invert from 'invert-color';
import blc from 'blessed-contrib';
import randItem from 'random-item';
import Api from './Api.mjs';
import fix from './fix.mjs';
import * as S from './selectors.mjs';
import ConfigEdit from './ConfigEdit.mjs';
import Notifications from './Notifications.mjs';

// Graphic design is my passion

class TuiApi extends Api {
	// Vars
	scr;
	loops;
	boxes;
	S;
	mymusic;
	atSongPage;
	notifs;
	args;
	songPageBuilt;

	constructor(args = []) {
		super();
		this.atSongPage = false;
		this.loops = {
			song: null
		}
		this.boxes = {
			song: null,
			songPage: null,
			spc: {
				lheader: null,
				centerImg: null
			},
			duration: null,
			collection: null,
			play: null,
			collectionItems: []
		}
		this.S = S;
		this.songPageBuilt = false;
		this.args = args;
	}

	async argParse() {
		if (hasFlag('--help', this.args)) {
			console.log(this.help);
			return false;
		} else if (hasFlag('--fix', this.args)) {
			await fix(this.udd);
			return false;
		} else if (hasFlag('--config', this.args)) {	
			const conf = new ConfigEdit();
			await conf.run(this.configPath);
		} else {
			return true;
		}
	}

	async close() {
		this.loaded = false;
		for (const loop in this.loops) {
			clearInterval(this.loops[loop]);
		}
		await super.close();
	}

	// Loops
	async #songLoop() {
		const song = await this.getSong() ?? 'Loading';
		const artist = await this.getArtist() ?? 'Loading';
		const colors = await this.getColors();
		const duration = await this.getDuration() ?? 'Buffering';
		var template = `${artist} - ${song} - Pandora`;
		this.scr.title = template;
		template = ` {bold}${song}{/bold} | ${artist}`;
		this.boxes.song.setContent(template);
		this.boxes.duration.setContent(duration);
		await this.drawPlayPause();

		this.boxes.song.style.bg = colors.bg;
		this.boxes.song.style.fg = colors.fg;
		this.boxes.duration.style.bg = colors.bg;
		this.boxes.duration.style.fg = colors.fg;
		this.boxes.play.style.bg = colors.bg;
		this.boxes.play.style.fg = colors.fg;
		this.boxes.songPage.style.fg = colors.fg;
		this.boxes.duration.left = `100%-${duration.length}`;

		this.notifs.checkHide(true);

		this.scr.render();
	}

	// Init functions
	async init() {
		const arg = await this.argParse();
		if (!arg) process.exit(0);
		await super.init();
		this.scr = bl.screen({
			smartCSR: true
		});
		this.scr.enableInput();
		this.loops.song = setInterval(this.#songLoop.bind(this), 500);
		this.scr.key(['escape', 'q', 'C-c'], async () => {
			await this.close();
		});
		this.scr.key(['space'], async () => {
			console.error('playpausing from blessed')
			await this.playPause();
			await this.drawPlayPause();

		});
		this.scr.key(['f5'], async () => {
			await this.drawCollection();
		});
		this.drawSong();
		this.boxes.song.focus();
		this.scr.render();
		this.notifs = new Notifications(this.scr, false);
		if (this.config.tips) this.notifs.info('Tip', randItem(this.tips));
		await this.drawCollection();
		this.initKeybind.bind(this)(this.keyHandler.bind(this));
	}
	initPlayPause() {
		this.boxes.play.on('click', async () => {
			await this.playPause();
			await this.drawPlayPause();
		});
	}

	// Draw functions (exlcuding loops)
	async drawCollection() {
		await this.fetchCollection();
		if (!this.mymusic) {
			this.notifs.err('Collection', 'Collection was not loaded, press F5 to try again');
			return;
		}
		console.error(this.mymusic);
		this.boxes.collectionItems = [];
		for (var item of this.mymusic) {
			const imgtest = bl.image({
				top: 10,
				left: 10,
				height: 8,
				width: 'shrink',
				type: 'overlay',
				file: item.img
			});
			this.scr.append(imgtest);
			var textBoxes = [];
			if (item.first.content !== '') {
				textBoxes.push(bl.box({
					top: 0,
					width: item.first.content.length,
					height: 1,
					content: item.first.content.replace(/{/g, '\{').replace(/}/g, '\}')
				}));
			}
			if (item.second.content !== '') {
				textBoxes.push(bl.box({
					top: 1,
					width: item.second.content.length,
					height: 1,
					content: item.second.content.replace(/{/g, '\{').replace(/}/g, '\}')
				}));
			}
			if (item.third.exists) {
				textBoxes.push(bl.box({
					top: 2,
					width: item.third.content.length,
					height: 1,
					content: `${item.third.content.replace(/{/g, '\{').replace(/}/g, '\}')}${
						item.third.explicit ? `{red-fg}${S.ICONS.EXPLICIT}{/}` : ''
					}${
						item.third.clean ? `{gray-fg}${S.ICONS.CLEAN}{/}` : ''
					}`,
					tags: true
				}));
			}
			this.boxes.collectionItems.push(bl.box({
				top: 0,
				width: '25%',
				height: 20,
				border: {
					type: 'line'
				},
				style: {
					border: {
						fg: this.notifs.cyan
					}
				},
				children: [
					...textBoxes,
					bl.image({
						height: 8,
						width: 'shrink',
						type: 'overlay',
						file: item.img
					})
				]
			}));
			break;
		}
		this.boxes.collection = bl.box({
			top: 1,
			left: 0,
			border: {
				type: 'line'
			},
			style: {
				border: {
					fg: this.notifs.cyan
				}
			},
			width: '100%',
			height: '100%-2',
			children: this.boxes.collectionItems
		});
		this.scr.append(this.boxes.collection);
		this.scr.render();
	}
	async drawPlayPause() {
		const playPaused = await this.getPlayPause() ? S.ICONS.PAUSE : S.ICONS.PLAY; // If the song is playing, the pause button should be shown
		this.boxes.play.setContent(playPaused);
		this.scr.render();
	}
	drawSong() {
		this.boxes.song = bl.box({
			top: '100%-1',
			left: 'center',
			width: '100%',
			height: 1,
			content: 'Loading',
			tags: true,
			style: {
				bg: 'white',
				fg: 'black'
			}
		});
		this.boxes.duration = bl.box({
			top: '100%-1',
			left: '100%-9',
			width: 'shrink',
			height: 1,
			align: 'right',
			content: 'Buffering',
			tags: true,
			style: {
				bg: 'white',
				fg: 'black'
			}
		});
		this.boxes.play = bl.button({
			top: '100%-1',
			left: 'center',
			width: 1,
			height: 1,
			content: S.ICONS.PLAY,
			style: {
				bg: 'white',
				fg: 'black'
			}
		});
		this.boxes.songPage = bl.box({
			top: 0,
			left: 'center',
			width: '100%',
			height: '100%-1',
			style: {
				bg: 'white',
				fg: 'black'
			}
		});
		this.hideSongPageBoxes();
		this.boxes.song.on('click', (async () => {
			if (this.songPageBuilt === 'inprogress') return;
			if (!this.songPageBuilt) await this.drawSongPage();
		}).bind(this));
		this.initPlayPause();
		//this.boxes.songPage.append(this.boxes.spc.lheader);
		this.scr.append(this.boxes.song);
		this.scr.append(this.boxes.duration);
		this.scr.append(this.boxes.play);
		this.scr.append(this.boxes.songPage);
	}
	async drawSongPage() {
		this.atSongPage = true;
		const songInfo = await this.songPage();
		console.error(songInfo);
		if (typeof songInfo === 'object') {
			console.error(songInfo);
		} else {
			this.notifs.err('Error', 'Song page could not be loaded');
			return;
		}
		this.buildSongPage(songInfo);
		this.showSongPageBoxes();
		//this.boxes.songPage.focus();
		this.scr.render();
	}
	buildSongPage(song) {
		this.songPageBuilt = 'inprogress';
		if (song.center) {
			console.error('img path:', song.center.img);
			console.error('w3m path:', this.config.w3m);
			this.boxes.spc.centerImg = bl.image({ // Width can be at a fixed value because all album covers are square on pandora
				top: '20%',
				left: 'center',
				height: '40%',
				width: '40%',
				type: 'overlay',
				file: song.center.img,
				w3m: this.config.w3m
			});
			this.scr.append(this.boxes.spc.centerImg);
		} else if (song.left) {
			this.boxes.spc.lheader = bl.box({
				top: '5%',
				left: '10%',
				width: '10%',
				height: 5,
				border: {
					type: 'line'
				},
				style: {
					bg: 'white',
					fg: 'black',
					border: {
						bg: 'white',
						fg: 'black'
					}
				}
			});
		}
		this.colorSongPageBoxes(song.bg);
		this.songPageBuilt = true;
	}
	colorSongPageBoxes(bg) {
		const fg = invert(bg, true);
		this.boxes.songPage.style.bg = bg;
		this.boxes.songPage.style.fg = fg;
		if (this.boxes.spc.lheader) {
			this.boxes.spc.lheader.style.fg = colors.fg;
			this.boxes.spc.lheader.style.border.fg = colors.fg;
		}
	}
	clearSongPage() {
		// TODO: Remove all boxes in songPage
	}
	hideSongPageBoxes() {
		/*
		 * This function along with its `show` counterpart don't have to be
		 * complex and recursive because the only elements in the `spc` object
		 * are either widgets or arrays of widgets.
		 */
		this.boxes.songPage.hide();
		for (const box in this.boxes.spc) {
			console.error(box);
			if (Array.isArray(this.boxes.spc[box])) {
				for (var i = 0; i < this.boxes.spc[box].length; i++) {
					this.boxes.spc[box][i].hide();
				}
			}
			if (this.boxes.spc[box]) this.boxes.spc[box].hide();
		}
	}
	showSongPageBoxes() {
		this.boxes.songPage.show();
		for (const box in this.boxes.spc) {
			console.error(box);
			if (Array.isArray(this.boxes.spc[box])) {
				for (var i = 0; i < this.boxes.spc[box].length; i++) {
					this.boxes.spc[box][i].show();
				}
			}
			if (this.boxes.spc[box]) this.boxes.spc[box].show();
		}
	}
	makeTransparent() {
		//TODO: iterate through this.boxes (excluding some), making boxes transparent
	}

	// Helpers
	async fetchCollection() {
		const _mymusic = await this.collection();
		if (!_mymusic) return false;
		for (var i = 0; i < _mymusic.length; i++) {
			_mymusic[i].img = await this.fetch(_mymusic[i].img);
		}
		this.mymusic = _mymusic;
		//console.error(this.mymusic);
	}
}

export default TuiApi;