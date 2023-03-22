export const AVATAR = '.Avatar';
export const COOKIES = '#onetrust-accept-btn-handler';
export const VIOLATION = '.SimStreamViolation__acceptLink';
export const SONG = {
	TITLE: 'a[data-qa="mini_track_title"]',
	ARTIST: 'a[data-qa="mini_track_artist_name"]',
	ELAPSED: 'span[data-qa="elapsed_time"]',
	REMAINING: 'span[data-qa="remaining_time"]',
	BAR: 'nav[data-qa="tuner_bar"]',
	BAR_HIT: 'a.Tuner__Audio__NowPlayingHitArea',
	BAR_PAGE: {
		ONDEMAND: {
			BG: 'svg.BlurredBackground__svg > rect',
			LEFT_COL: {
				LEFT_COL: 'div.NowPlayingOnDemand__leftCol',
				COLLECTED: 'div.NowPlayingOnDemand__trackListHeader > div.RowItem > div.SourceCard > div.SourceCard__trigger > div.RowItem__content > div.RowItem__columns > div.RowItemLeftColumn > div.RowItemCollectedBadge',
				TITLE: 'div.NowPlayingOnDemand__trackListHeader > div.RowItem > div.SourceCard > div.SourceCard__trigger > div.RowItem__content > div.RowItem__columns > div.RowItemCenterColumn > div.RowItemCenterColumn__mainText > a',
				ARTIST: 'div.NowPlayingOnDemand__trackListHeader > div.RowItem > div.SourceCard > div.SourceCard__trigger > div.RowItem__content > div.RowItem__columns > div.RowItemCenterColumn > div.RowItemCenterColumn__secondText > a'
			}
		}
	},
	PLAY: 'button[data-qa="play_button"]',
	PAUSE: 'button[data-qa="pause_button"]',
	SKIP: 'button[data-qa="t3_skip_forward_button"]',
	REWIND: 'button[data-qa="t3_skip_back_button"]'
}
export const MYMUSIC = {
	COLLECTION: 'a[data-qa="header_my_stations_link"]',
	INFINITEGRID: 'div.InfiniteGrid__contents',
	ITEM_THUMBNAIL: 'div.GridItem > div.GridItem__thumbnail > div.SourceCard > div.SourceCard__trigger > div.GridItem__thumbnail__content > div.ImageLoader > img',
	ITEM_FIRST: 'div.GridItem > div.GridItem__metaInfo > div.GridItem__caption > div.GridItem__caption__main > a',
	ITEM_SECOND: 'div.GridItem > div.GridItem__metaInfo > div.GridItem__caption > div.GridItem__caption__second',
	ITEM_THIRD: 'div.GridItem > div.GridItem__metaInfo > div.GridItem__caption > div.GridItem__caption__third',
	ITEM_THIRD_TXT: 'span.GridItem__caption__text',
	ITEM_THIRD_E: 'div.Badge > div.Badge__text'
}
export const PLACEHOLDER = 'https://via.placeholder.com/500x500.png?text=?';
export const MUTE = ['--mute-audio'];
export const ARGS = ['--app=https://pandora.com/account/sign-in', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'];
export const XVFB = xvfb => [`--display=${xvfb._display}`];
export const XVFB_OPTS = {
	displayNum: 99,
	reuse: true,
	xvfb_args: ['-ac'],
}
export const ICONS = {
	PLAY: '▶',
	PAUSE: '⏸'
}

export const ERRS = {
	CLOSED: e => e.toString().includes('Runtime.callFunctionOn'),
	CLOSED_MSG: n => `Session closed at ${n}`
}
