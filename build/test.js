"use strict";
const Mocha = require("mocha");
const fs = require("fs");
const path = require("path");
require('ts-node/register');
function test(dir) {
    const mocha = new Mocha();
    mocha.reporter("dot");
    fs.readdirSync(dir).filter(function (file) {
        // Only keep the .js files
        return file.substr(-3) === '.ts';
    }).forEach(function (file) {
        mocha.addFile(path.join(dir, file));
    });
    mocha.run(function (failures) {
        process.on('exit', function () {
            process.exit(failures); // exit with non-zero status if there were failures
        });
    });
}
exports.test = test;
