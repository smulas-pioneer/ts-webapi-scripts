import 'whatwg-fetch';
import * as express from 'express';
const cors = require('cors');

let _services: { [name: string]: string };

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

app.get('/register/:serviceName/:endPoint', (req, res) => {
    _services[req["serviceName"]] = req["endPoint"];
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
            body: args
        }).then(res => res.json());
    });
}

