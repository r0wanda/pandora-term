import bl from 'blessed';
import invert from 'invert-color';
import blc from 'blessed-contrib';
import randItem from 'random-item';
import Api from './Api.mjs'
import * as S from './selectors.mjs';
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

	constructor() {
		super();
		this.atSongPage = false;
		this.loops = {
			song: null
		}
		this.boxes = {
			song: null,
			songPage: null,
			spc: {
				lheader: null
			},
			duration: null,
			collection: null,
			play: null,
			collectionItems: []
		}
		this.S = S;
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
		this.boxes.spc.lheader.style.fg = colors.fg;
		this.boxes.spc.lheader.style.border.fg = colors.fg;
		this.boxes.duration.left = `100%-${duration.length}`;

		this.notifs.checkHide(true);

		this.scr.render();
	}

	// Init functions
	async init() {
		await super.init();
		this.scr = bl.screen({
			smartCSR: true
		});
		this.scr.enableInput();
		this.drawSong();
		this.loops.song = setInterval(this.#songLoop.bind(this), 500);
		this.scr.key(['escape', 'q', 'C-c'], async () => {
			await this.close();
		});
		this.scr.key(['space'], async () => {
			console.error('playpausing from blessed')
			await this.playPause();
			await this.drawPlayPause();

		});
		this.scr.key(['r'], async () => {
			await this.drawCollection();
		});
		this.boxes.song.focus();
		this.scr.render();
		this.notifs = new Notifications(this.scr, false);
		if (this.config.tips) this.notifs.info('Tip', randItem(this.tips));
		//this.notifs.info('test', 'a reallllllll llllllllllll llllllll lllllllllllll lll llllllll llllll lllllllll lllllll llll lllly lllllll llllllll lllllll lllong nnnn nnnnnnn nnnnnn nnnnnnn notificationnn nnnnnnnnnnnnn nnnnnnnnn nnnnnnnnnnnnnn nnnnnnnnnnnnnnnnn nnnnnnnnnnnnnnnnnnnn nnnnnnnnnnnnnnnnnn nn');
		await this.drawCollection();
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
		if (!this.mymusic) return;
		this.boxes.collection = bl.box();
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
		})
		this.hideSongPageBoxes();
		this.boxes.song.on('click', async () => {
			await this.drawSongPage();
		});
		this.initPlayPause();
		this.boxes.songPage.append(this.boxes.spc.lheader);
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
			return;
		} else {
			
		}
		const fg = invert(songInfo.bg, true);
		this.colorSongPageBoxes()
		this.showSongPageBoxes();
		this.boxes.songPage.focus();
		this.scr.render();
	}
	colorSongPageBoxes(bg, fg) {

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
			this.boxes.spc[box].hide();
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
			this.boxes.spc[box].show();
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