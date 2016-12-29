import * as express from 'express';
import * as parser from 'body-parser';
import {selfRegister} from './service-locator';
import {logInfo} from './log';

const path = require('path');
const cors = require('cors');
const app = express();
const service = {
    name: '',
    port: 0
}

let logger: (msg:string) =>void = console.info;

app.use(cors());
app.options('*', cors());
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));

//Error Handler
const errorHandler = (err, req, res, next) => {
    logger("ERROR!!!!" + JSON.stringify(err, null, 2));
    res.status(500);
    res.send(err);
}

app.get('/ver', (req, res) => {
    res.send('1.0.0');
});

export type Api<TArg,TRes> = <TArg, TRes>(arg: TArg) => Promise<TRes>;

export function registerPost<TArg, TRes>(method: Api<TArg,TRes> | Api<TArg,TRes>[]) {
    if (Array.isArray(method)) {
        (method as Api<TArg,TRes>[]).forEach(internalRegisterPost);
    } else {
        internalRegisterPost(method as Api<TArg,TRes>);
    }
}

function internalRegisterPost<TArg, TRes>(method: Api<TArg,TRes>) {
    app.post('/' + method.name, (request, response) => {
        logger(`POST ${method.name} `);
        const args = request.body as TArg;
        try {
            method(args).then(res => {
                response.send(res);
            }).catch(err => {
                response.status(610).send(err);
            });
        } catch (err) {
            response.status(611).send(err);
        }
    });
}

export function start(name:string,port: number) {
    app.use(errorHandler);
    app.listen(port, () => {
        service.name = name;
        service.port = port;
        logger = logInfo(service);
        logger('started');
        logger(JSON.stringify(app.routes,null,2));
                
        /* register */
        selfRegister(name,port).then(res=>logger('registered'));
    });
}

