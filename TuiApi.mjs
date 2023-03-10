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
			collection: null
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
		let template = `${artist} - ${song} - Pandora`;
		this.scr.title = template;
		template = ` {bold}${song}{/bold} | ${artist}`;
		this.boxes.song.setContent(template);
		this.boxes.duration.setContent(duration);
		console.error(colors);
		this.boxes.song.style.bg = colors.bg;
		this.boxes.song.style.fg = colors.fg;
		this.boxes.duration.style.bg = colors.bg;
		this.boxes.duration.style.fg = colors.fg;
		this.boxes.duration.left = `100%-${duration.length}`;
		this.scr.render();
	}

	// Init
	async init() {
		await super.init();
		this.scr = bl.screen({
			smartCSR: true,
		});
		this.boxes.song = bl.box({
			top: '100%-1',
			left: 'center',
			width: '100%',
			height: 1,
			content: 'Loading',
			tags: true,
			style: {
				fg: 'white',
				bg: 'black',
			},
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
				bg: 'invisible',
				fg: 'white',
			},
		});
		this.scr.append(this.boxes.song);
		this.scr.append(this.boxes.duration);
		this.loops.song = setInterval(this.#songLoop.bind(this), 1000);
		this.scr.key(['escape', 'q', 'C-c'], async () => {
			await this.close();
		});
		this.scr.key(['space'], async () => {
			console.error('playpausing from blessed')
			await this.playPause();
		});
		this.scr.key(['r'], async () => {
			await this.drawCollection();
		});
		this.boxes.song.focus();
		this.scr.render();
		await this.drawCollection();
	}

	async drawCollection() {
		const _mymusic = await this.collection();
		for (var i = 0; i < _mymusic.length; i++) {
			_mymusic[i].img = await this.fetch(_mymusic[i].img);
		}
		this.mymusic = _mymusic;
		console.error(this.mymusic);
		//this.boxes.collection = bl.box()
	}
}

export default TuiApi;