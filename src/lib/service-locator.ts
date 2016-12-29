import fetch,{Response} from 'node-fetch';
import * as express from 'express';
const cors = require('cors');

let _services: { [name: string]: string } = {};

/*SERVER */
const app = express();
app.use(cors());
app.options('*', cors());

app.get('/services', (req, res) => {
    res.send(_services);
});

app.get('/services/:serviceName', (req, res) => {
    res.send(_services[req["serviceName"]]);
});

app.get('/register', (req, res) => {
    const {service,endpoint} = req.query;
    if ( !service ) res.status(500).send('service arg missing');
    if ( !endpoint ) res.status(500).send('endpoint arg missing');
    _services[service] = endpoint;
    res.send('ok');
});

app.get('/register/:service/:port', (req, res) => {
    const {service,port} = req.params;
    const endpoint = req.ip + ":" + port;
    _services[service] = endpoint;
    res.send('ok');
});


export function startServiceLocator(port = 6969) {
    app.listen(port, () => {
        console.info(`Service Locator started on port ${port}`);
    });
}

/* CLIENT */
const serviceLocatorUrl = process.env.SERVICE_LOCATOR_URL || 'http://localhost:6969';

export function getService(name: string) {
    if (_services[name]) {
        return Promise.resolve(_services[name]);
    } else {
        return fetch(serviceLocatorUrl + '/services/' + name).then(res => res.text()).then(
            endpoint => {
                _services[name] = endpoint;
                return endpoint;
            }
        )
    }
}

export const call = (serviceName: string) => (method: string) => (args: any, headers?: any) => {
    return getService(serviceName).then(endpoint => {
        return fetch(endpoint + '/' + method, {
            headers,
            method:'post',
            body: args
        }).then(res=>res.json());
    });
}

export const selfRegister = (serviceName:string, port: number) => {
    return fetch(`${serviceLocatorUrl}/register/${serviceName}/${port}`).then(res=>res.json());
}