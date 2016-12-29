"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
const test_1 = require("./test");
const program = require("commander");
__export(require("./express"));
program
    .version('1.0.0')
    .option('-t, --test <dir>', 'Run tests on selected dir')
    .parse(process.argv);
if (program['test']) {
    test_1.test(program['test']);
}
