import ch from 'chalk';
import inq from 'inquirer';
import { sync as rmd } from 'rimraf';
import { join as pjoin } from 'path';
import { existsSync as ex } from 'fs';
import { execSync as exec } from 'child_process';
import * as S from './selectors.mjs';
import ora from './ora.mjs';

const capital = n => n === 1 ? '' : 's';

const ls = p => parseInt(exec(`sh -c "find ${p} -type f | wc -l"`).toString());

async function fix(datadir) {
    console.log(ch.green('Fixing by clearing user data'));
    console.log(ch.cyan(`${S.ICONS.INFO} Works most of the time, report an issue if problems persist`));
    if (ex(datadir)) {
        console.log(ch.green(`Found directory ${datadir}`));
        const fcount = ls(datadir);
        const udd = ex(pjoin(datadir, 'Last Version'));
        if (udd) console.log(ch.cyan(`${S.ICONS.INFO} Directory is (most likely) chrome data, it should be fine to delete.`));
        else console.log(ch.red('Directory is NOT chrome data. Don\'t proceed unless you are absoultely sure.'));
        console.log(ch.yellow(`Directory has ${fcount} file${capital(fcount)}, proceeding will delete all of them`));
        const res = await inq.prompt([
            {
                type: 'confirm',
                name: 'delete',
                message: ch[udd ? 'yellow' : 'red'](`Delete ${datadir}${udd ? '' : ' (NOT reccomended)'}?`),
                default: udd
            }
        ]);
        if (res.delete) {
            var spin = ora(`Deleting ${datadir}`);
            rmd(datadir);
            spin.succeed('Done!');
            if (udd) console.log(ch.cyan(`${S.ICONS.INFO} Directory will be recreated on next startup`));
        }
    } else {
        console.log(ch.red(`Directory ${datadir} not found`));
    }
}

export default fix;
