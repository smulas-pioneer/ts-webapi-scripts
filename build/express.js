"use strict";
const express = require("express");
const parser = require("body-parser");
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
app.options('*', cors());
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));
//Error Handler
const errorHandler = (err, req, res, next) => {
    console.error("ERROR!!!!", JSON.stringify(err, null, 2));
    res.status(500);
    res.send(err);
};
app.get('/ver', (req, res) => {
    res.send('1.0.0');
});
function registerPost(method) {
    console.info(`register method ${method.name}`);
    app.post('/' + method.name, (request, response) => {
        const args = request.body;
        try {
            method(args).then(res => {
                response.send(res);
            }).catch(err => {
                response.status(610).send(err);
            });
        }
        catch (err) {
            response.status(611).send(err);
        }
    });
}
exports.registerPost = registerPost;
function start(port) {
    app.use(errorHandler);
    app.listen(port, () => {
        console.info(`service started on port ${port}`);
    });
}
exports.start = start;
