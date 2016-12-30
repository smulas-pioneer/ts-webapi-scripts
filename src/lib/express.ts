import * as express from 'express';
import * as parser from 'body-parser';
import fetch, { Response } from 'node-fetch';

const path = require('path');
const cors = require('cors');

const serviceLocatorUrl = process.env.SERVICE_LOCATOR_URL || 'http://localhost:6969';

export type Api<TArg, TRes> = <TArg, TRes>(arg: TArg) => Promise<TRes>;

export const createService = (name: string, port: number) => {
    let _services: { [name: string]: string } = {};

    const app = express();
    app.use(cors());
    app.options('*', cors());
    app.use(parser.json());
    app.use(parser.urlencoded({ extended: false }));

    app.use((req, res, next) => {
        log(req.method + ' ' + req.url + ' ' + JSON.stringify(req.body || req.query));
        next();
    });

    app.get('/ver', (req, res) => {
        res.send('1.0.0');
    });

    app.get('/services', (req, res) => {
        res.send(_services);
    });

    app.get('/services/:serviceName', (req, res) => {
        res.send(_services[req.params["serviceName"]]);
    });

    app.get('/register', (req, res) => {
        const {service, endpoint} = req.query;
        if (!service) res.status(500).send('service arg missing');
        if (!endpoint) res.status(500).send('endpoint arg missing');
        _services[service] = endpoint;
        res.send({ service, endpoint });
    });

    app.get('/register/:service/:port', (req, res) => {
        const {service, port} = req.params;
        const endpoint = req.ip.replace('::ffff:', 'http://') + ":" + port;
        _services[service] = endpoint;
        res.send({ service, endpoint });
    });

    const log = (msg: string) => console.info(`${port} ${name} ${msg}`);
    const internalRegisterPost = <TArg, TRes>(method: Api<TArg, TRes>) => {
        app.post('/' + method.name, (request, response) => {
            try {
                const args = request.body as TArg;
                method(args).then(res => {
                    log(`OK  :${request.url} ${JSON.stringify(res)}`);
                    response.send(res);
                }).catch(err => {
                    log(`ERR : ${request.url} ${JSON.stringify(err)}`);
                });
            } catch (err) {
                response.status(611).send(err);
            }
        });
    }

    const internalRegisterGet = <TArg, TRes>(method: Api<TArg, TRes>) => {
        app.get('/' + method.name, (request, response) => {
            log(`POST ${method.name} args:${JSON.stringify(request.query)}`);
            try {
                const args = request.query as TArg;
                method(args).then(res => {
                    log(`OK  :${request.url} ${JSON.stringify(res)}`);
                    response.send(res);
                }).catch(err => {
                    log(`ERR : ${request.url} ${JSON.stringify(err)}`);
                    response.status(610).send(err);
                });
            } catch (err) {
                response.status(611).send(err);
            }
        });
    }


    //Error Handler
    const errorHandler = (err, req, res, next) => {
        log("ERROR!!!!" + JSON.stringify(err, null, 2));
        res.status(500);
        res.send(err);
    }

    const getService = (name: string) => {
        if (_services[name]) {
            return Promise.resolve(_services[name]);
        } else {
            return fetch(serviceLocatorUrl + '/services/' + name).then(res => res.text()).then(
                endpoint => {
                    log(`endpoint for ${name} is ${endpoint}`);
                    _services[name] = endpoint;
                    return endpoint;
                }
            )
        }
    }

    const selfRegister = (serviceName: string, port: number) => {
        return fetch(`${serviceLocatorUrl}/register/${serviceName}/${port}`).then(res => res.json());
    }

    return {
        registerGet: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => {
            if (Array.isArray(method)) {
                (method as Api<TArg, TRes>[]).forEach(internalRegisterGet);
            } else {
                internalRegisterGet(method as Api<TArg, TRes>);
            }
        },
        registerPost: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => {
            if (Array.isArray(method)) {
                (method as Api<TArg, TRes>[]).forEach(internalRegisterPost);
            } else {
                internalRegisterPost(method as Api<TArg, TRes>);
            }
        },
        start: () => {
            app.use(errorHandler);
            app.listen(port, () => {
                log('started');

                /* register */
                selfRegister(name, port).then(res => log('registered'));
            });
        },
        call: (serviceName: string) => (method: string) => (args: any, headers?: any) => {
            log(`call ${serviceName}/${method} ${JSON.stringify(args)}`);
            return getService(serviceName).then(endpoint => {
                return fetch(endpoint + '/' + method, {
                    headers: {...headers,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify(args),

                }).then(res => res.json());
            });
        },
        log
    }

}
