import process from 'node:process';
import _fig from 'figlet';
import ch from 'chalk';
import TuiApi from './TuiApi.mjs';
import { createWriteStream as cws, readFileSync as rf } from 'node:fs';

const config = JSON.parse(rf('config.json'));
const stderr = cws(config.logfile);
process.stderr.write = stderr.write.bind(stderr);
const fig = _fig.textSync;
/*process.argv.map(arg => {
	switch (arg) {

	}
})*/

const api = new TuiApi();

console.log(ch.blue(fig('Pandora', {
	font: 'Slant',
})));

api.init();

