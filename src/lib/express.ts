import * as express from 'express';
import * as parser from 'body-parser';
import {selfRegister} from './service-locator';
const path = require('path');
const cors = require('cors');
const app = express();
const service = {
    name: '',
    port: 0
}


app.use(cors());
app.options('*', cors());
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));

//Error Handler
const errorHandler = (err, req, res, next) => {
    logInfo("ERROR!!!!" + JSON.stringify(err, null, 2));
    res.status(500);
    res.send(err);
}

app.get('/ver', (req, res) => {
    res.send('1.0.0');
});

export type Api<TArg,TRes> = <TArg, TRes>(arg: TArg) => Promise<TRes>;

export function registerPost<TArg, TRes>(method: Api<TArg,TRes> | Api<TArg,TRes>[]) {
    if (method.length) {
        (method as Api<TArg,TRes>[]).forEach(internalRegisterPost);
    } else {
        internalRegisterPost(method as Api<TArg,TRes>);
    }
}

function internalRegisterPost<TArg, TRes>(method: Api<TArg,TRes>) {
    app.post('/' + method.name, (request, response) => {
        logInfo(`POST ${method.name} `);
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
        logInfo('started');

        logInfo(JSON.stringify(app.routes,null,2));
                
        /* register */
        selfRegister(name,port).then(res=>logInfo('registered'));
    });
}

export function logInfo (message: string ){
    console.info(`${service.name}(port:${service.port}) ${message}`);
}