import bl from 'blessed';
import Api from './Api.mjs'
import * as S from './selectors.mjs';

class TuiApi extends Api {
	// Vars
	scr;
	loops;
	boxes;
	S;
	mymusic;

	constructor() {
		super();
		this.loops = {
			song: null
		};
		this.boxes = {
			song: null,
			duration: null,
			collection: null,
			play: null,
			collectionItems: []
		};
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
		this.boxes.duration.left = `100%-${duration.length}`;
		this.scr.render();
	}

	// Init
	async init() {
		await super.init();
		this.scr = bl.screen({
			smartCSR: true,
		});
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
		await this.drawCollection();
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
				bg: 'black',
				fg: 'white'
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
				bg: 'black',
				fg: 'white'
			}
		});
		this.boxes.play = bl.button({
			top: '100%-1',
			left: 'center',
			width: 1,
			height: 1,
			content: S.ICONS.PLAY,
			style: {
				bg: 'black',
				fg: 'white'
			}
		});
		this.scr.append(this.boxes.song);
		this.scr.append(this.boxes.duration);
		this.scr.append(this.boxes.play);
	}

	// Helpers
	async fetchCollection() {
		const _mymusic = await this.collection();
		if (!_mymusic) return false;
		for (var i = 0; i < _mymusic.length; i++) {
			_mymusic[i].img = await this.fetch(_mymusic[i].img);
		}
		this.mymusic = _mymusic;
		console.error(this.mymusic);
	}
}

export default TuiApi;