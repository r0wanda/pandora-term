import process from 'node:process';
import _fig from 'figlet';
import lol from 'lolcatjs';
import TuiApi from './TuiApi.mjs';
import { createWriteStream as cws, readFileSync as rf } from 'node:fs';

const config = JSON.parse(rf('config.json'));
//const stderr = cws(config.logfile);
//process.stderr.write = stderr.write.bind(stderr);
const fig = _fig.textSync;
lol.options.seed = Math.round(Math.random() * 1000);
lol.options.colors = true;
/*process.argv.map(arg => {
	switch (arg) {

	}
})*/

const api = new TuiApi();

console.log(lol.fromString(fig('Pandora', {
	font: 'Slant'
})));

api.init();

