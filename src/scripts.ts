import {test} from './test';
import * as  program from 'commander';

program
    .version('1.0.0')
    .option('-t, --test <dir>','Run tests on selected dir')
    .parse(process.argv);

if ( program['test']){
    test(program['test']);
}
