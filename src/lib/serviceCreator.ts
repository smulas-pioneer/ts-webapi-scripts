import * as express from 'express';
import * as parser from 'body-parser';
import fetch, { Response } from 'node-fetch';
import * as http from "http";

const path = require('path');
const cors = require('cors');

const serviceLocatorUrl = process.env.SERVICE_LOCATOR_URL || 'http://localhost:6969';

export type Api<TArg, TRes> = <TArg, TRes>(arg: TArg) => Promise<TRes>;

export interface IService {
    name: string,
    port: number,
    get: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => void;
    post: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => void;
    start: () => Promise<IService>;
    call: (serviceName: string) => (method: string) => (args: any, headers?: any) => Promise<any>;
    log: (msg: string) => void;
    stop: () => void;
    register: (serviceName:string, endpoint:string) =>void;
    server:http.Server;
}

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
        internalRegister(service,endpoint);
        res.send({ service, endpoint });
    });

    app.get('/register/:service/:port', (req, res) => {
        const {service, port} = req.params;
        const endpoint = req.ip.replace('::ffff:', 'http://') + ":" + port;
        internalRegister(service,endpoint);
        res.send({ service, endpoint });
    });

    const internalRegister = (serviceName:string, endpoint:string) =>{
         _services[serviceName] = endpoint;
        log(`registered ${serviceName} on endpoint ${endpoint}`);
    }

    const log = (msg: string) => console.info(`${port} ${name} ${msg}`);
    const internalPost = <TArg, TRes>(method: Api<TArg, TRes>) => {
        app.post('/' + method.name, (request, response) => {
            try {
                const args = request.body as TArg;
                method(args).then(res => {
                    log(`OK  :${request.url} ${JSON.stringify({data:res})}`);
                    response.send({data:res});
                }).catch(err => {
                    log(`ERR : ${request.url} ${JSON.stringify(err)}`);
                    response.status(610).send(err);
                });
            } catch (err) {
                response.status(611).send(err);
            }
        });
    }

    const internalGet = <TArg, TRes>(method: Api<TArg, TRes>) => {
        app.get('/' + method.name, (request, response) => {
            try {
                const args = request.query as TArg;
                method(args).then(res => {
                    log(`OK  :${request.url} ${JSON.stringify({data:res})}`);
                    response.send({data:res});
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
        log(`self register ${serviceName} ${port}`);
        return fetch(`${serviceLocatorUrl}/register/${serviceName}/${port}`);
    }


    const svc: IService = {
        register: internalRegister,
        get: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => {
            if (Array.isArray(method)) {
                (method as Api<TArg, TRes>[]).forEach(internalGet);
            } else {
                internalGet(method as Api<TArg, TRes>);
            }
        },
        post: <TArg, TRes>(method: Api<TArg, TRes> | Api<TArg, TRes>[]) => {
            if (Array.isArray(method)) {
                (method as Api<TArg, TRes>[]).forEach(internalPost);
            } else {
                internalPost(method as Api<TArg, TRes>);
            }
        },
        start: () => {
            return new Promise<IService>((resolve, reject) => {
                app.use(errorHandler);
                svc.server = app.listen(port, () => {
                    log('started');
                    resolve(svc);
                });
            });
        },
        call: (serviceName: string) => (method: string) => (args: any, headers?: any) => {
            return getService(serviceName).then(endpoint => {
                log(`call  ${serviceName}=> ${endpoint}/${method} ${JSON.stringify(args)}`);
                return fetch(endpoint + '/' + method, {
                    headers: {
                        ...headers,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify(args),

                }).then(res => res.json().then(res2=>{
                    log(`call result ${JSON.stringify(res2)}`);
                    return res2;
                }));
            });
        },
        log,
        stop: () => {
            log('shutdown');
            svc.server.close();
        },
        server: null,
        name,
        port
    }
    return svc;
}
