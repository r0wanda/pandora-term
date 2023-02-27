import process from 'node:process';
import _fig from 'figlet';
import ch from 'chalk';
import TuiApi from './TuiApi.mjs';

const fig = _fig.textSync;
const api = new TuiApi();

console.log(ch.blue(fig('Pandora', {
	font: 'Slant',
})));

api.init();

