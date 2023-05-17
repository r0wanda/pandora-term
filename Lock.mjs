import ch from 'chalk';
import inq from 'inquirer';
import { readFileSync as rf, writeFileSync as wf, existsSync as ex, unlinkSync as df } from 'node:fs';

class Lock {
    lockFile;
    constructor(lockFile) {
        this.lockFile = lockFile;
    }
    async lock(quiet = false) {
        if (ex(this.lockFile) && rf(this.lockFile, 'utf8') !== process.pid.toString()) {
            console.log(ch.red('Lockfile in use by other program'));
            console.log(ch.cyan('You may proceed if you\'re certain there are no other instances of the config editor running.'));
            console.log(ch.cyan('If there are other instances it may result in ') + ch.red('data loss.'));
            const ow = await inq.prompt([
                {
                    type: 'confirm',
                    name: 'configconfirm',
                    message: 'Overwrite lockfile?',
                    default: false
                }
            ]);
            if (!ow.configconfirm) {
                console.log(ch.red('Close all other instances before running again'));
                process.exit(1);
            }
        }
        wf(this.lockFile, process.pid.toString());
        if (!quiet) console.log(ch.cyan(`Lockfile enabled at ${this.lockFile}`));
    }
    unlock() {
        df(this.lockFile);
    }
}

export default Lock;
